-- Phase 2: identity + roles foundation.
-- Additive only. Does not touch service_categories, service_types or
-- service_requests, and does not delete any existing data.
--
-- This file is NOT applied automatically. Review it and apply it yourself
-- (`supabase db push` or the Supabase SQL editor) before Phase 2 auth is
-- expected to work end to end against the remote project.
--
-- Role representation decision: `role` is a constrained `text` column
-- (`check (role in (...))`), not a Postgres `enum`. Enums are awkward to
-- evolve safely (adding a value is fine, renaming/removing one is not,
-- and every migration touching the type needs care); a checked text column
-- gives the same guarantee against garbage values while staying trivial to
-- extend in a later, purely additive migration if more roles are needed.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'professional', 'admin')),
  full_name text,
  phone text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- SECURITY DEFINER + a pinned search_path so this can't be tricked by a
-- session-local search_path change, and so RLS policies that call it don't
-- recurse into the profiles RLS they're themselves gating.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, anon;

drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

-- No insert policy for client roles: profiles are only ever created by the
-- trigger below (which runs as the function owner and so bypasses RLS),
-- never directly by a signed-in client.

-- Row-level: an owner (or admin) may attempt to update their row.
-- Column-level (below): but only specific, non-privileged columns are
-- actually writable by `authenticated` at all, so a client cannot smuggle a
-- role change through this policy even though the row check would pass.
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles
  for update
  using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

revoke update on profiles from authenticated;
grant update (full_name, phone, avatar_path, updated_at) on profiles to authenticated;

-- New signups default to 'customer'. This trigger is the only path that
-- creates a profile row, and it never reads a role from client-supplied
-- signup metadata — role is hardcoded here, so a client sending
-- `{ data: { role: 'admin' } }` at sign-up has no effect whatsoever.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'customer',
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin bootstrap is intentionally a manual, documented step — never an
-- automatic promotion path from application code. See
-- docs/validation/phase2.md for the exact one-time SQL to run yourself
-- against a specific known user id after they've signed up normally.
