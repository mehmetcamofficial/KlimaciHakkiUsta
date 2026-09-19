export type RequestStatus =
  | "Talep alındı"
  | "Usta aranıyor"
  | "Usta atandı"
  | "Yolda"
  | "Servis tamamlandı";

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  iconKey: string;
  description: string;
  active: boolean;
  sortOrder: number;
}

export interface ServiceType {
  id: string;
  categoryId: string;
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  sortOrder: number;
}

export interface ServiceRequest {
  id: number;
  requestNo: string;
  categoryId: string | null;
  categorySlug: string | null;
  serviceTypeId: string | null;
  serviceTypeSlug: string | null;
  description: string | null;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  status: RequestStatus | string;
  // Klima-only legacy fields, kept optional for backward compatibility.
  brand?: string | null;
  acType?: string | null;
  problemType?: string | null;
  technicianName?: string | null;
  technicianPhone?: string | null;
  technicianLatitude?: number | null;
  technicianLongitude?: number | null;
  rating?: number | null;
  reviewComment?: string | null;
}

export interface CreateServiceRequestInput {
  categorySlug: string;
  categoryId?: string | null;
  serviceTypeSlug: string;
  serviceTypeId?: string | null;
  serviceTypeName: string;
  description: string;
  phone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  photoUri?: string | null;
  photoMimeType?: string | null;
  // Klima-only legacy fields.
  brand?: string | null;
  acType?: string | null;
}
