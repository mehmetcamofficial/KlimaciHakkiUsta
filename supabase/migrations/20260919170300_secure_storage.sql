-- Phase 2: secure request-photo storage.
--
-- ** Apply this one separately/last, and only when you're ready. ** Unlike
-- the other Phase 2 migrations, flipping the bucket to private changes
-- behavior for every object already in it the instant it runs: any
-- `photo_url` (public URL) already stored on an existing service_requests
-- row will stop resolving. This migration does not rename, move, copy or
-- delete a single object — that is a separate, manual operational step you
-- may want to do first (or accept: old rows keep their now-dead
-- `photo_url` string, which is harmless, it just won't load an image).
--
-- New uploads after this is applied (see services/requests.ts) write to
-- `{auth.uid()}/{requestNo}/{filename}` and are read back through a
-- signed URL, not a permanent public one.

-- Stores the new owner-scoped object path alongside the legacy `photo_url`
-- (left untouched for old rows). The app resolves a fresh signed URL from
-- `photo_path` on demand instead of storing one (signed URLs expire).
alter table if exists service_requests
  add column if not exists photo_path text;

do $$
begin
  if exists (select 1 from storage.buckets where id = 'service-photos') then
    update storage.buckets set public = false where id = 'service-photos';
  else
    insert into storage.buckets (id, name, public)
    values ('service-photos', 'service-photos', false);
  end if;
end $$;

drop policy if exists "service-photos read own" on storage.objects;
create policy "service-photos read own" on storage.objects
  for select
  using (
    bucket_id = 'service-photos'
    and (
      public.is_admin(auth.uid())
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "service-photos insert own" on storage.objects;
create policy "service-photos insert own" on storage.objects
  for insert
  with check (
    bucket_id = 'service-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No update/delete policy for `authenticated`: customers cannot overwrite
-- or remove a request photo once uploaded (evidentiary — same as before,
-- uploads already used upsert: false). Admins have no special storage
-- policy for delete either in this phase; add one deliberately later if
-- moderation needs it.

-- Legacy objects uploaded before this migration used a flat
-- `{requestNo}.<ext>` path with no owner folder, so they cannot be
-- attributed to any auth.uid(). Leave them exactly where they are and let
-- only admins read them, instead of deleting/renaming them automatically.
drop policy if exists "service-photos read legacy admin only" on storage.objects;
create policy "service-photos read legacy admin only" on storage.objects
  for select
  using (
    bucket_id = 'service-photos'
    and cardinality(storage.foldername(name)) = 0
    and public.is_admin(auth.uid())
  );
