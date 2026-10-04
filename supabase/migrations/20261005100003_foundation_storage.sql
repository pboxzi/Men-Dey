-- ============================================================
-- Gillian Anderson Management · Foundation 4/5
-- Storage: five PRIVATE buckets + object-level policies
-- ============================================================
-- Buckets (spec §STORAGE, all private, no anonymous access):
--   profile-photos      — user avatar files, path convention <uid>/<file>
--   documents           — account & request documents,        <uid>/<file>
--   membership-assets   — membership evidence/attachments,    <uid>/<file>
--   experience-assets   — experience request attachments,     <uid>/<file>
--   management-media    — internal media library (management only)
-- Ownership rule: the first path segment is the owning user's id.

insert into storage.buckets (id, name, public)
values
  ('profile-photos',    'profile-photos',    false),
  ('documents',         'documents',         false),
  ('membership-assets', 'membership-assets', false),
  ('experience-assets', 'experience-assets', false),
  ('management-media',  'management-media',  false)
on conflict (id) do nothing;

update storage.buckets set public = false, updated_at = now()
 where id in ('profile-photos','documents','membership-assets','experience-assets','management-media')
   and public is distinct from false;

-- NOTE on grants: storage table grants are issued by supabase_storage_admin and
-- cannot be revoked by the postgres role. This matches standard Supabase
-- posture — RLS is the security boundary for storage: anon/authenticated hold
-- table grants, but with no policy matching them they read/write ZERO rows.
-- (Verified by supabase/tests/foundation_rls_probe.sql.)

-- ------------------------------------------------------------
-- profile-photos: readable by any signed-in user, writable by owner
-- ------------------------------------------------------------
drop policy if exists "profile photos read" on storage.objects;
create policy "profile photos read" on storage.objects
  for select to authenticated using (bucket_id = 'profile-photos');

drop policy if exists "profile photos owner write" on storage.objects;
create policy "profile photos owner write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (select auth.uid()) is not null
    and (string_to_array(name, '/'))[1] = (select auth.uid()::text)
  );

drop policy if exists "profile photos owner update" on storage.objects;
create policy "profile photos owner update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      ((select auth.uid()) is not null
        and (string_to_array(name, '/'))[1] = (select auth.uid()::text))
      or (select public.is_management())
    )
  )
  with check (
    bucket_id = 'profile-photos'
    and (
      ((select auth.uid()) is not null
        and (string_to_array(name, '/'))[1] = (select auth.uid()::text))
      or (select public.is_management())
    )
  );

drop policy if exists "profile photos owner delete" on storage.objects;
create policy "profile photos owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      ((select auth.uid()) is not null
        and (string_to_array(name, '/'))[1] = (select auth.uid()::text))
      or (select public.is_management())
    )
  );

drop policy if exists "profile photos management write" on storage.objects;
create policy "profile photos management write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-photos' and (select public.is_management()));

-- ------------------------------------------------------------
-- documents / membership-assets / experience-assets:
-- owner folder + management, never other users
-- ------------------------------------------------------------
drop policy if exists "user buckets read" on storage.objects;
create policy "user buckets read" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('documents','membership-assets','experience-assets')
    and (
      ((select auth.uid()) is not null
        and (string_to_array(name, '/'))[1] = (select auth.uid()::text))
      or (select public.is_management())
    )
  );

drop policy if exists "user buckets insert" on storage.objects;
create policy "user buckets insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('documents','membership-assets','experience-assets')
    and (
      ((select auth.uid()) is not null
        and (string_to_array(name, '/'))[1] = (select auth.uid()::text))
      or (select public.is_management())
    )
  );

drop policy if exists "user buckets update" on storage.objects;
create policy "user buckets update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('documents','membership-assets','experience-assets')
    and (
      ((select auth.uid()) is not null
        and (string_to_array(name, '/'))[1] = (select auth.uid()::text))
      or (select public.is_management())
    )
  )
  with check (
    bucket_id in ('documents','membership-assets','experience-assets')
    and (
      ((select auth.uid()) is not null
        and (string_to_array(name, '/'))[1] = (select auth.uid()::text))
      or (select public.is_management())
    )
  );

drop policy if exists "user buckets delete" on storage.objects;
create policy "user buckets delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('documents','membership-assets','experience-assets')
    and (
      ((select auth.uid()) is not null
        and (string_to_array(name, '/'))[1] = (select auth.uid()::text))
      or (select public.is_management())
    )
  );

-- ------------------------------------------------------------
-- management-media: management only
-- ------------------------------------------------------------
drop policy if exists "management media read" on storage.objects;
create policy "management media read" on storage.objects
  for select to authenticated
  using (bucket_id = 'management-media' and (select public.is_management()));

drop policy if exists "management media insert" on storage.objects;
create policy "management media insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'management-media' and (select public.is_management()));

drop policy if exists "management media update" on storage.objects;
create policy "management media update" on storage.objects
  for update to authenticated
  using (bucket_id = 'management-media' and (select public.is_management()))
  with check (bucket_id = 'management-media' and (select public.is_management()));

drop policy if exists "management media delete" on storage.objects;
create policy "management media delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'management-media' and (select public.is_management()));
