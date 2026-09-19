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

export async function uploadRequestPhoto(
  photoUri: string,
  requestNo: string,
  mimeType = "image/jpeg",
): Promise<string | null> {
  const response = await fetch(photoUri);
  const arrayBuffer = await response.arrayBuffer();

  const filePath = `${requestNo}.${mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : mimeType === "image/heic" ? "heic" : "jpg"}`;

  const { error } = await supabase.storage
    .from("service-photos")
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("service-photos")
    .getPublicUrl(filePath);

  return data.publicUrl;
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
  status: string;
}

interface ServiceRequestMarketplacePayload extends ServiceRequestLegacyPayload {
  category_slug: string;
  category_id: string | null;
  service_type_slug: string;
  service_type_id: string | null;
}

function isMissingMarketplaceColumnsError(error: {
  code?: string;
  message?: string;
}): boolean {
  if (!["PGRST204", "42703"].includes(error.code ?? "")) return false;
  const message = error.message ?? "";
  return /category_id|category_slug|service_type_id|service_type_slug/.test(
    message,
  );
}

/**
 * Creates a service request. The insert first tries the full marketplace
 * payload (category/service-type slugs and ids). If the target database
 * doesn't have those columns yet — the migration in
 * `supabase/migrations` hasn't been applied — it transparently retries with
 * the legacy-only payload so request creation (including the Klima flow)
 * keeps working either way.
 */
export async function createServiceRequest(
  input: CreateServiceRequestInput,
): Promise<{ requestNo: string }> {
  const requestNo = generateRequestNo();
  const photoUrl = input.photoUri
    ? await uploadRequestPhoto(
        input.photoUri,
        requestNo,
        input.photoMimeType ?? undefined,
      )
    : null;

  const legacyPayload: ServiceRequestLegacyPayload = {
    request_no: requestNo,
    phone: input.phone,
    address: input.address,
    note: input.description,
    brand: input.brand ?? null,
    ac_type: input.acType ?? null,
    problem_type: input.serviceTypeName,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    photo_url: photoUrl,
    status: "Talep alındı",
  };

  const marketplacePayload: ServiceRequestMarketplacePayload = {
    ...legacyPayload,
    category_slug: input.categorySlug,
    category_id: input.categoryId ?? null,
    service_type_slug: input.serviceTypeSlug,
    service_type_id: input.serviceTypeId ?? null,
  };

  let { error } = await supabase
    .from("service_requests")
    .insert(marketplacePayload);

  if (error && isMissingMarketplaceColumnsError(error)) {
    ({ error } = await supabase
      .from("service_requests")
      .insert({
        ...legacyPayload,
        note: `[Hizmet: ${input.categorySlug} / ${input.serviceTypeSlug}]\n${input.description}`,
      }));
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
  created_at?: string;
  photo_url: string | null;
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
export async function listRequests(): Promise<RequestRow[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .order("id", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
export async function getRequest(
  requestNo: string,
): Promise<RequestRow | null> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("request_no", requestNo)
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
export function subscribeRequests(name: string, onChange: () => void) {
  const channel = supabase
    .channel(name)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "service_requests" },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
