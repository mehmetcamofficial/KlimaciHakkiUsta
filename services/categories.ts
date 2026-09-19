import { supabase } from '@/lib/supabase';
import { SERVICE_CATALOG } from '@/data/service-catalog';
import type { ServiceCategory, ServiceType } from '@/types/domain';

function localCategories(): ServiceCategory[] {
  return SERVICE_CATALOG.map((entry) => entry.category)
    .filter((category) => category.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function localServiceTypes(categorySlug: string): ServiceType[] {
  const entry = SERVICE_CATALOG.find((item) => item.category.slug === categorySlug);
  if (!entry) return [];
  return entry.serviceTypes.filter((type) => type.active).sort((a, b) => a.sortOrder - b.sortOrder);
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
    iconKey: row.icon_key ?? 'help-circle',
    description: row.description ?? '',
    active: row.active ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}

function mapServiceTypeRow(row: ServiceTypeRow, categorySlug: string): ServiceType {
  return {
    id: row.id,
    categoryId: row.category_id,
    categorySlug,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    active: row.active ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}

/**
 * Reads categories from Supabase (`service_categories`) when available, and
 * transparently falls back to the local seed catalog otherwise — e.g. when
 * the marketplace migration hasn't been applied to the remote database yet,
 * or the device is offline. This keeps the discovery screen usable in every
 * state instead of showing a blank screen.
 */
export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return localCategories();
    }

    return data.map(mapCategoryRow);
  } catch {
    return localCategories();
  }
}

export async function fetchServiceCategoryBySlug(slug: string): Promise<ServiceCategory | null> {
  const categories = await fetchServiceCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function fetchServiceTypesByCategorySlug(categorySlug: string): Promise<ServiceType[]> {
  try {
    const { data: categoryRow, error: categoryError } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', categorySlug)
      .maybeSingle();

    if (categoryError || !categoryRow) {
      return localServiceTypes(categorySlug);
    }

    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('category_id', categoryRow.id)
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return localServiceTypes(categorySlug);
    }

    return data.map((row) => mapServiceTypeRow(row, categorySlug));
  } catch {
    return localServiceTypes(categorySlug);
  }
}
