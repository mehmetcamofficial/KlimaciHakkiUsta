-- Additive follow-up; review against the actual schema before manual application.
-- Does not modify existing requests or remove any legacy fields.
create index if not exists service_types_active_order_idx
  on public.service_types (category_id, active, sort_order);
create index if not exists service_categories_active_order_idx
  on public.service_categories (active, sort_order);
-- Request columns were added by 20260919120000_marketplace_foundation.sql.
-- No assumptions about remote request IDs, policies, or constraints are added here.
