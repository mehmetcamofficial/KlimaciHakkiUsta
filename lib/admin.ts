/**
 * Pure admin-shell data: the planned information architecture (sidebar
 * items) and the request-status vocabulary the dashboard/operations screen
 * both need. Kept dependency-free so it can be unit tested without
 * rendering, matching lib/rbac.ts and lib/responsive.ts.
 *
 * `implemented: false` items are real navigation entries (the requested
 * planned IA) that currently render an honest "yakında" placeholder
 * instead of a built module — see app/admin/[module].tsx.
 */
export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  implemented: boolean;
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", implemented: true },
  { key: "requests", label: "Talepler", href: "/admin/requests", implemented: true },
  { key: "operations", label: "Operasyon", href: "/admin/operations", implemented: true },
  { key: "customers", label: "Müşteriler", href: "/admin/musteriler", implemented: false },
  { key: "professionals", label: "Ustalar", href: "/admin/ustalar", implemented: false },
  {
    key: "applications",
    label: "Usta Başvuruları",
    href: "/admin/usta-basvurulari",
    implemented: false,
  },
  {
    key: "catalog",
    label: "Kategoriler & Hizmetler",
    href: "/admin/kategoriler-hizmetler",
    implemented: false,
  },
  { key: "reviews", label: "Yorumlar", href: "/admin/yorumlar", implemented: false },
  { key: "complaints", label: "Şikayetler", href: "/admin/sikayetler", implemented: false },
  {
    key: "notifications",
    label: "Bildirimler",
    href: "/admin/bildirimler",
    implemented: false,
  },
  { key: "finance", label: "Finans", href: "/admin/finans", implemented: false },
  { key: "reports", label: "Raporlar", href: "/admin/raporlar", implemented: false },
  {
    key: "roles",
    label: "Kullanıcı & Roller",
    href: "/admin/kullanici-roller",
    implemented: false,
  },
  {
    key: "settings",
    label: "Sistem Ayarları",
    href: "/admin/sistem-ayarlari",
    implemented: false,
  },
  {
    key: "audit-log",
    label: "Denetim Kayıtları",
    href: "/admin/denetim-kayitlari",
    implemented: false,
  },
];

/**
 * The finite set of statuses the admin UI knows how to write (see the
 * existing operations panel) and therefore the set the dashboard can
 * honestly count by status without inventing categories the schema
 * doesn't actually distinguish.
 */
export const KNOWN_REQUEST_STATUSES: readonly string[] = [
  "Talep alındı",
  "Usta aranıyor",
  "Usta atandı",
  "Yolda",
  "Servis tamamlandı",
];

/**
 * Maps an /admin/[module] URL segment back to its Turkish label for the
 * placeholder screen, from the same single source of truth as the sidebar
 * — so a placeholder page's title can never drift from what the sidebar
 * called it.
 */
export function adminModuleLabel(slug: string | undefined): string | null {
  const item = ADMIN_NAV_ITEMS.find((entry) => entry.href === `/admin/${slug}`);
  return item?.label ?? null;
}
