-- Phase 2 follow-up: explicit base table GRANTs for `authenticated` (and
-- `anon` for the public catalog). Additive/idempotent — GRANT is a no-op
-- if already present, and every statement is guarded so this is safe to
-- run whether or not the target table exists yet.
--
-- Root cause this addresses: RLS policies on profiles/service_requests
-- were created in prior Phase 2 migrations, but Postgres checks base
-- table privileges (GRANT) *before* RLS -- a role with RLS policies but
-- no GRANT is denied with "permission denied for table X" (SQLSTATE
-- 42501) before any policy is even evaluated. Confirmed at runtime:
--
--   SQLSTATE 42501
--   permission denied for table service_requests
--
-- No RLS policy, function, or trigger is changed by this file.

do $$
begin
  if to_regclass('public.profiles') is not null then
    -- INSERT intentionally NOT granted here: profiles are only ever
    -- created by the handle_new_user trigger (security definer, runs as
    -- the function owner, bypasses grants entirely) -- granting INSERT
    -- to authenticated would let a client create arbitrary profile rows
    -- directly, which is not the intended path. The existing
    -- column-scoped UPDATE grant (full_name, phone, avatar_path,
    -- updated_at) from 20260919170000_profiles_and_roles.sql is
    -- untouched by this file.
    grant select on public.profiles to authenticated;
  end if;

  if to_regclass('public.service_requests') is not null then
    -- DELETE intentionally not granted: nothing in the app ever deletes
    -- a service_requests row.
    grant select, insert, update on public.service_requests to authenticated;
  end if;

  if to_regclass('public.service_categories') is not null then
    grant select on public.service_categories to authenticated, anon;
  end if;

  if to_regclass('public.service_types') is not null then
    grant select on public.service_types to authenticated, anon;
  end if;
end $$;

-- Defensive: if service_requests.id is a classic sequence-backed column
-- (serial/bigserial with a nextval() default, as opposed to a
-- GENERATED ... AS IDENTITY column, which Postgres handles differently),
-- INSERT also needs a separate grant on the backing sequence. This is a
-- no-op if the column isn't sequence-backed, or if the table doesn't
-- exist. The sequence name is never assumed -- it's looked up via
-- pg_get_serial_sequence().
do $$
declare
  seq_name text;
begin
  if to_regclass('public.service_requests') is not null then
    select pg_get_serial_sequence('public.service_requests', 'id') into seq_name;
    if seq_name is not null then
      execute format('grant usage, select on sequence %s to authenticated', seq_name);
    end if;
  end if;
end $$;
