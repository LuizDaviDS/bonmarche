insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'bonmarche-media',
  'bonmarche-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "bonmarche_media_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'bonmarche-media');

create policy "bonmarche_media_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'bonmarche-media'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "bonmarche_media_admin_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'bonmarche-media'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
)
with check (
  bucket_id = 'bonmarche-media'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "bonmarche_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'bonmarche-media'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);
