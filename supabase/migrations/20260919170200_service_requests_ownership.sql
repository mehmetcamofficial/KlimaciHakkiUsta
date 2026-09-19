-- Phase 2: customer ownership + RLS for service_requests.
-- Additive only. Does not drop/rename any column, does not delete or
-- reassign any existing row. Depends on public.is_admin(uuid) from
-- 20260919170000_profiles_and_roles.sql — apply that one first.
--
-- Legacy rows (created before Phase 2, or before this migration is
-- applied) keep customer_id = NULL. They are intentionally NOT visible to
-- any customer (NULL never equals a specific auth.uid()) and are only
-- readable through the admin path (public.is_admin). This is a deliberate
-- choice, not an oversight: customers must not gain broad access merely
-- because some legacy rows happen to have no owner. Reconciling legacy
-- rows with a real customer (if ever needed) is a separate, manual,
-- admin-side operation — this migration does not attempt it.

alter table if exists service_requests
  add column if not exists customer_id uuid references auth.users (id);

create index if not exists service_requests_customer_id_idx
  on service_requests (customer_id);

do $$
begin
  if to_regclass('public.service_requests') is null then
    return;
  end if;

  execute 'alter table service_requests enable row level security';

  execute 'drop policy if exists service_requests_select on service_requests';
  execute $p$
    create policy service_requests_select on service_requests
      for select
      using (auth.uid() = customer_id or public.is_admin(auth.uid()))
  $p$;

  execute 'drop policy if exists service_requests_insert on service_requests';
  execute $p$
    create policy service_requests_insert on service_requests
      for insert
      with check (auth.uid() = customer_id or public.is_admin(auth.uid()))
  $p$;

  -- Row-level visibility only. Which *columns* a non-admin owner may
  -- actually change is enforced by the trigger below, not by this policy —
  -- Postgres RLS is a row filter, not a column filter, and a plain
  -- USING/WITH CHECK pair here could not stop an owner from writing to
  -- `status` or `technician_*` in the same statement as `rating`.
  execute 'drop policy if exists service_requests_update on service_requests';
  execute $p$
    create policy service_requests_update on service_requests
      for update
      using (auth.uid() = customer_id or public.is_admin(auth.uid()))
      with check (auth.uid() = customer_id or public.is_admin(auth.uid()))
  $p$;
end $$;

-- Column-level update guard. Admins may change anything. A non-admin owner
-- may only change `rating`/`review_comment`, and only once the request is
-- already completed. Comparing to_jsonb(old) vs to_jsonb(new) with those two
-- keys removed — instead of hardcoding every other column name — means this
-- keeps working correctly regardless of which optional columns
-- (category_id, service_type_slug, etc.) happen to exist on this database.
create or replace function public.enforce_service_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if old.customer_id is distinct from auth.uid() then
    raise exception 'not authorized to update this request';
  end if;

  if old.status is distinct from 'Servis tamamlandı' then
    raise exception 'reviews can only be added once the service is completed';
  end if;

  if (to_jsonb(old) - 'rating' - 'review_comment')
     <> (to_jsonb(new) - 'rating' - 'review_comment') then
    raise exception 'customers may only update rating and review_comment';
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.service_requests') is not null then
    execute 'drop trigger if exists service_requests_update_guard on service_requests';
    execute $t$
      create trigger service_requests_update_guard
        before update on service_requests
        for each row execute function public.enforce_service_request_update()
    $t$;
  end if;
end $$;

-- Realtime: make sure postgres_changes on service_requests is actually
-- backed by row data (required for RLS-aware change events) and that the
-- table is part of the realtime publication. Both are idempotent.
alter table if exists service_requests replica identity full;

do $$
begin
  if to_regclass('public.service_requests') is not null
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'service_requests'
     )
  then
    alter publication supabase_realtime add table service_requests;
  end if;
exception
  when undefined_object then
    -- supabase_realtime publication doesn't exist on this project; nothing
    -- to add it to. Not an error condition for this migration.
    null;
end $$;
