import { supabase } from "@/lib/supabase";
import { SERVICE_CATALOG } from "@/data/service-catalog";
import type { ServiceCategory, ServiceType } from "@/types/domain";

function localCategories(): ServiceCategory[] {
  return SERVICE_CATALOG.map((entry) => entry.category)
    .filter((category) => category.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function localServiceTypes(categorySlug: string): ServiceType[] {
  const entry = SERVICE_CATALOG.find(
    (item) => item.category.slug === categorySlug,
  );
  if (!entry) return [];
  return entry.serviceTypes
    .filter((type) => type.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

interface ServiceCategoryRow {
  id: string;
  name: string;
  slug: string;
  icon_key: string | null;
  description: string | null;
  active: boolean | null;
  sort_order: number | null;
}

interface ServiceTypeRow {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean | null;
  sort_order: number | null;
}

function mapCategoryRow(row: ServiceCategoryRow): ServiceCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    iconKey: row.icon_key ?? "help-circle",
    description: row.description ?? "",
    active: row.active ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}

function mapServiceTypeRow(
  row: ServiceTypeRow,
  categorySlug: string,
): ServiceType {
  return {
    id: row.id,
    categoryId: row.category_id,
    categorySlug,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    active: row.active ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}

export interface CatalogResult {
  categories: ServiceCategory[];
  serviceTypes: ServiceType[];
  source: "remote" | "local";
}
/** Read the catalog as one snapshot: never mix remote UUIDs and fallback identifiers. */
export async function fetchCatalog(): Promise<CatalogResult> {
  try {
    const [categories, types] = await Promise.all([
      supabase
        .from("service_categories")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("service_types")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
    ]);
    const error = categories.error ?? types.error;
    if (error) {
      // Only absent migration uses the bundled catalog. Permission/network errors remain visible.
      if (!["42P01", "PGRST205"].includes(error.code))
        throw new Error("Hizmetler şu anda yüklenemiyor.");
      return {
        categories: localCategories(),
        serviceTypes: SERVICE_CATALOG.flatMap((entry) =>
          localServiceTypes(entry.category.slug),
        ),
        source: "local",
      };
    }
    const mapped = (categories.data ?? []).map(mapCategoryRow);
    return {
      categories: mapped,
      serviceTypes: (types.data ?? []).flatMap((row) => {
        const category = mapped.find((item) => item.id === row.category_id);
        return category ? [mapServiceTypeRow(row, category.slug)] : [];
      }),
      source: "remote",
    };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Hizmetler şu anda yüklenemiyor.");
  }
}
