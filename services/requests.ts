import { supabase } from '@/lib/supabase';
import type { CreateServiceRequestInput } from '@/types/domain';

export function generateRequestNo(): string {
  return 'KHU-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
}

export async function uploadRequestPhoto(photoUri: string, requestNo: string): Promise<string | null> {
  const response = await fetch(photoUri);
  const arrayBuffer = await response.arrayBuffer();

  const filePath = `${requestNo}.jpg`;

  const { error } = await supabase.storage.from('service-photos').upload(filePath, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('service-photos').getPublicUrl(filePath);

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

function isMissingMarketplaceColumnsError(error: { code?: string; message?: string }): boolean {
  if (error.code === 'PGRST204' || error.code === '42703') return true;
  const message = error.message ?? '';
  return /column .*(does not exist|could not find)/i.test(message);
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
  input: CreateServiceRequestInput
): Promise<{ requestNo: string }> {
  const requestNo = generateRequestNo();
  const photoUrl = input.photoUri ? await uploadRequestPhoto(input.photoUri, requestNo) : null;

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
    status: 'Talep alındı',
  };

  const marketplacePayload: ServiceRequestMarketplacePayload = {
    ...legacyPayload,
    category_slug: input.categorySlug,
    category_id: input.categoryId ?? null,
    service_type_slug: input.serviceTypeSlug,
    service_type_id: input.serviceTypeId ?? null,
  };

  let { error } = await supabase.from('service_requests').insert(marketplacePayload);

  if (error && isMissingMarketplaceColumnsError(error)) {
    ({ error } = await supabase.from('service_requests').insert(legacyPayload));
  }

  if (error) {
    throw error;
  }

  return { requestNo };
}
