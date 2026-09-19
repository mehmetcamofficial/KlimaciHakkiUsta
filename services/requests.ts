import { supabase } from "@/lib/supabase";
import type { CreateServiceRequestInput } from "@/types/domain";

export function generateRequestNo(): string {
  return (
    "UY-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 10).toUpperCase()
  );
}

/**
 * Thrown when the database is missing a column this app version needs
 * (e.g. `customer_id` before the Phase 2 ownership migration is applied).
 * Kept distinct from a generic failure so the UI can tell the user this is
 * a temporary server-side configuration gap, not something they can fix by
 * retrying with different input.
 */
export class ConfigurationError extends Error {}

function extensionFor(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/heic") return "heic";
  return "jpg";
}

interface UploadedPhoto {
  /** Owner-scoped storage object path, e.g. `{uid}/{requestNo}/photo.jpg`. */
  path: string;
  /**
   * `getPublicUrl`'s URL for that path. Only actually resolves while the
   * `service-photos` bucket is still public (i.e. before
   * 20260919170300_secure_storage.sql is applied) — kept as a legacy-shape
   * fallback for `photo_url`, never relied on once `photo_path` is set.
   */
  legacyPublicUrl: string;
}

export async function uploadRequestPhoto(
  photoUri: string,
  customerId: string,
  requestNo: string,
  mimeType = "image/jpeg",
): Promise<UploadedPhoto> {
  const response = await fetch(photoUri);
  const arrayBuffer = await response.arrayBuffer();

  const path = `${customerId}/${requestNo}/photo.${extensionFor(mimeType)}`;

  const { error } = await supabase.storage
    .from("service-photos")
    .upload(path, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("service-photos").getPublicUrl(path);

  return { path, legacyPublicUrl: data.publicUrl };
}

/**
 * Resolves an openable URL for a request's photo: a freshly-generated
 * signed URL when the (private, Phase 2) `photo_path` is set, otherwise the
 * legacy public URL for rows uploaded before Phase 2. Returns null if
 * neither is present, or if signing fails (e.g. the object no longer
 * exists).
 */
export async function getRequestPhotoUrl(
  row: Pick<RequestRow, "photo_path" | "photo_url">,
): Promise<string | null> {
  if (row.photo_path) {
    const { data, error } = await supabase.storage
      .from("service-photos")
      .createSignedUrl(row.photo_path, 60 * 60);
    if (error) return null;
    return data.signedUrl;
  }
  return row.photo_url;
}

interface ServiceRequestLegacyPayload {
  request_no: string;
  phone: string;
  address: string;
  note: string;
  brand: string | null;
  ac_type: string | null;
  problem_type: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  photo_path: string | null;
  status: string;
}

interface ServiceRequestOwnedPayload extends ServiceRequestLegacyPayload {
  customer_id: string;
}

interface ServiceRequestMarketplacePayload extends ServiceRequestOwnedPayload {
  category_slug: string;
  category_id: string | null;
  service_type_slug: string;
  service_type_id: string | null;
}

/** Columns whose absence just means an optional migration isn't applied
 * yet — safe to drop from the payload and retry. `customer_id` is
 * deliberately not in this list; see createServiceRequest. */
const DEGRADABLE_COLUMNS = [
  "category_id",
  "category_slug",
  "service_type_id",
  "service_type_slug",
  "photo_path",
] as const;

function missingColumn(error: { code?: string; message?: string }): string | null {
  if (!["PGRST204", "42703"].includes(error.code ?? "")) return null;
  const message = error.message ?? "";
  const match = message.match(/category_id|category_slug|service_type_id|service_type_slug|photo_path|customer_id/);
  return match?.[0] ?? null;
}

/**
 * Creates a service request owned by `input.customerId`.
 *
 * The insert is attempted with the full payload, then retried with one
 * more optional column dropped each time the database reports that column
 * missing (bounded by DEGRADABLE_COLUMNS.length so this can't loop forever)
 * — this way any subset of the optional Phase 1/2 migrations being applied
 * (or not) still results in a successful insert with whatever richer data
 * the schema currently supports.
 *
 * If `customer_id` itself is missing (the Phase 2 ownership migration
 * hasn't been applied), this throws a `ConfigurationError` instead of
 * silently creating an unowned request — unlike the columns above,
 * ownership is a security property, not a data-richness nicety, so it is
 * never silently dropped.
 */
export async function createServiceRequest(
  input: CreateServiceRequestInput,
): Promise<{ requestNo: string }> {
  const requestNo = generateRequestNo();
  const uploaded = input.photoUri
    ? await uploadRequestPhoto(
        input.photoUri,
        input.customerId,
        requestNo,
        input.photoMimeType ?? undefined,
      )
    : null;

  const fullPayload: ServiceRequestMarketplacePayload = {
    request_no: requestNo,
    phone: input.phone,
    address: input.address,
    note: input.description,
    brand: input.brand ?? null,
    ac_type: input.acType ?? null,
    problem_type: input.serviceTypeName,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    photo_url: uploaded?.legacyPublicUrl ?? null,
    photo_path: uploaded?.path ?? null,
    status: "Talep alındı",
    customer_id: input.customerId,
    category_slug: input.categorySlug,
    category_id: input.categoryId ?? null,
    service_type_slug: input.serviceTypeSlug,
    service_type_id: input.serviceTypeId ?? null,
  };

  let payload: Record<string, unknown> = { ...fullPayload };
  let error: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt <= DEGRADABLE_COLUMNS.length; attempt++) {
    ({ error } = await supabase.from("service_requests").insert(payload));
    if (!error) break;

    const column = missingColumn(error);
    if (column === "customer_id") {
      throw new ConfigurationError(
        "Talep sahipliği için veritabanı güncellemesi henüz uygulanmadı.",
      );
    }
    if (!column || !(column in payload)) break;
    const { [column]: _dropped, ...rest } = payload;
    payload = rest;
  }

  if (error) {
    throw error;
  }

  return { requestNo };
}

/** Legacy wire shape is isolated here until a verified schema is generated. */
export interface RequestRow {
  id: number;
  request_no: string;
  status: string;
  phone: string;
  address: string;
  note: string | null;
  problem_type: string | null;
  brand: string | null;
  ac_type: string | null;
  category_slug?: string | null;
  service_type_slug?: string | null;
  customer_id?: string | null;
  created_at?: string;
  photo_url: string | null;
  photo_path?: string | null;
  latitude: number | null;
  longitude: number | null;
  technician_name: string | null;
  technician_phone: string | null;
  technician_latitude: number | null;
  technician_longitude: number | null;
  rating: number | null;
  review_comment: string | null;
  eta?: string | null;
}

/**
 * The authenticated customer's own requests (Taleplerim). Filtered
 * client-side by `customer_id` as well as by RLS — both are expected to
 * agree; the client filter keeps the intent explicit and the screen correct
 * even before/without RLS being verified.
 */
export async function listOwnRequests(customerId: string): Promise<RequestRow[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("id", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

/**
 * All requests, for the admin operations screen. Relies entirely on RLS: a
 * genuine admin's row will be allowed to see every request; anyone else's
 * database role only ever gets their own rows back regardless of this
 * unfiltered query, because the database — not this function — is the
 * authorization boundary.
 */
export async function listRequestsForAdmin(): Promise<RequestRow[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .order("id", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

/** A customer looking up their own request by number (Takip). */
export async function getOwnRequest(
  requestNo: string,
  customerId: string,
): Promise<RequestRow | null> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("request_no", requestNo)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRequest(
  id: number,
  changes: Partial<
    Pick<
      RequestRow,
      | "status"
      | "technician_latitude"
      | "technician_longitude"
      | "rating"
      | "review_comment"
    >
  >,
) {
  const { error } = await supabase
    .from("service_requests")
    .update(changes)
    .eq("id", id);
  if (error) throw error;
}

/**
 * Subscribes to service_requests changes and calls `onChange` (which is
 * expected to re-fetch through the RLS-scoped functions above — the
 * realtime payload itself is never read or trusted for authorization).
 * Pass `filterCustomerId` to also scope the subscription itself, as
 * defense-in-depth alongside RLS rather than instead of it.
 */
export function subscribeRequests(
  name: string,
  onChange: () => void,
  filterCustomerId?: string,
) {
  const channel = supabase.channel(name).on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "service_requests",
      ...(filterCustomerId ? { filter: `customer_id=eq.${filterCustomerId}` } : {}),
    },
    onChange,
  );
  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
