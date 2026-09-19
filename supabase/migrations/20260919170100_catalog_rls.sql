-- Phase 2: enable RLS on the marketplace catalog tables introduced in
-- 20260919120000_marketplace_foundation.sql. Additive/idempotent — does not
-- change any row, and category/service-type browsing stays public (no
-- login required), matching the existing product behavior (Ana Sayfa and
-- /services/[categorySlug] are public routes).
--
-- Safe to apply independently of the other Phase 2 migrations, and safe to
-- apply even if 20260919120000_marketplace_foundation.sql (which creates
-- these tables) has not been applied yet — the `if exists` guards make this
-- a no-op in that case rather than an error.

do $$
begin
  if to_regclass('public.service_categories') is not null then
    execute 'alter table service_categories enable row level security';
    execute 'drop policy if exists service_categories_select_active on service_categories';
    execute $p$
      create policy service_categories_select_active on service_categories
        for select
        using (active = true)
    $p$;
  end if;

  if to_regclass('public.service_types') is not null then
    execute 'alter table service_types enable row level security';
    execute 'drop policy if exists service_types_select_active on service_types';
    execute $p$
      create policy service_types_select_active on service_types
        for select
        using (active = true)
    $p$;
  end if;
end $$;

-- No insert/update/delete policy is created for either table: writes stay
-- deny-by-default for every client role. Managing the catalog remains an
-- operator/SQL-side task (see README "Yeni kategori / hizmet tipi ekleme").
