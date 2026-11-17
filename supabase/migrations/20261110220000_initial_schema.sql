create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  singleton boolean not null default true unique check (singleton),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text not null check (length(btrim(slug)) > 0),
  description text,
  image_path text,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index categories_slug_unique
  on public.categories (lower(slug));

create index categories_active_order_idx
  on public.categories (sort_order, name)
  where archived_at is null;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image_path text,
  available boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_order_idx
  on public.products (category_id, sort_order, name)
  where archived_at is null;

create index products_featured_order_idx
  on public.products (sort_order, name)
  where featured and archived_at is null;

create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  description text,
  logo_path text,
  phone text,
  address text,
  singleton boolean not null default true unique check (singleton),
  updated_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "categories_public_select_active"
on public.categories
for select
to anon, authenticated
using (archived_at is null);

create policy "categories_admin_all"
on public.categories
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "products_public_select_active"
on public.products
for select
to anon, authenticated
using (
  archived_at is null
  and exists (
    select 1
    from public.categories
    where categories.id = products.category_id
      and categories.archived_at is null
  )
);

create policy "products_admin_all"
on public.products
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "store_settings_public_select"
on public.store_settings
for select
to anon, authenticated
using (true);

create policy "store_settings_admin_insert"
on public.store_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

create policy "store_settings_admin_update"
on public.store_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

grant select on public.categories, public.products, public.store_settings
to anon, authenticated;
grant insert, update, delete on public.categories, public.products
to authenticated;
grant insert, update on public.store_settings to authenticated;
grant select on public.profiles to authenticated;

insert into public.store_settings (name)
values ('Bonmarché');
