# Supabase

## Migrations

The SQL files in `migrations/` define the database schema and security policies.
Keep migrations in version control and apply them in order.

The initial migration creates the four core tables, enables RLS, and grants public
read access only to active menu data and store details. Administrative access
depends on a row in `profiles` whose ID matches the authenticated Supabase user.
Only one administrator profile and one store-settings row can exist.

The first store-settings row is seeded with the name `Bonmarché`; replace it
through the admin settings workflow when that is available.

## Initial administrator

1. Disable public sign-ups in Supabase Auth.
2. Create the administrator user through the Supabase dashboard.
3. After applying the initial migration, insert that user's UUID into
   `public.profiles` using the SQL Editor. Do not add a public profile insert
   policy; it would let users grant themselves administrator access.

The product-to-category foreign key uses `ON DELETE RESTRICT`. The migration
`20261112200000_admin_delete_category.sql` adds the authenticated-only
`admin_delete_category` RPC. It runs as the caller (`SECURITY INVOKER`), verifies
the caller's profile, and atomically transfers all associated products to an
active destination category or deletes those products together with the category.
The choice is made explicitly in the admin UI. This RPC is necessary because
separate PostgREST updates/deletes could otherwise leave a partially changed
category if one request failed. Apply this migration after the initial schema
and storage migrations; it does not use `service_role` or bypass RLS.

## Product, category, and logo media

The `bonmarche-media` bucket is public so the public menu can display its images.
It accepts JPEG, PNG, and WebP raster images only (no SVG), with a maximum file
size of 5 MiB per object.

Objects remain accessible by their public URLs; a public bucket does not need a
`SELECT` policy on `storage.objects` for that access. Clients are not authorized
to list the bucket's objects. The administrator uses image paths already stored
in the product, category, and store-settings records instead of listing the
bucket. Creating, updating, and deleting objects is restricted to authenticated
users who have a matching row in `public.profiles`; each storage policy is
scoped to this bucket. These policies do not grant access to other buckets.

Apply every migration in timestamp order. If
`20261112162200_storage_media_bucket.sql` has already been applied, apply the
later `20261112165000_storage_media_remove_public_listing.sql` forward migration
to remove its public object-listing policy. Do not edit or reapply an
already-applied migration. The forward migration does not change the bucket's
public setting or its administrative INSERT, UPDATE, and DELETE policies.

## Running the admin workflow

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in
`.env.local`, apply the migrations in order, disable public sign-ups, and create
the administrator profile as described above. The admin routes and every
mutation verify the profile through the caller's Supabase session. Product and
store-logo uploads validate file signature, declared MIME type, extension and
the 5 MiB limit before uploading. The Server Action body limit is set to 6 MiB
to allow the validated maximum file size plus multipart form overhead.
