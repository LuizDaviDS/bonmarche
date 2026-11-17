create or replace function public.admin_delete_category(
  p_category_id uuid,
  p_mode text,
  p_target_category_id uuid default null
)
returns text[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_category_image text;
  v_product_images text[] := array[]::text[];
  v_media_paths text[];
begin
  if (select auth.uid()) is null
    or not exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
    )
  then
    raise exception 'Administrator authorization required';
  end if;

  if p_mode is null or p_mode not in ('delete_products', 'transfer') then
    raise exception 'Invalid category deletion mode';
  end if;

  select categories.image_path
    into v_category_image
    from public.categories
    where categories.id = p_category_id
    for update;

  if not found then
    raise exception 'Category not found';
  end if;

  if p_mode = 'transfer' then
    if p_target_category_id is null or p_target_category_id = p_category_id then
      raise exception 'A different destination category is required';
    end if;

    perform 1
      from public.categories
      where categories.id = p_target_category_id
        and categories.archived_at is null
      for update;

    if not found then
      raise exception 'Active destination category not found';
    end if;

    update public.products
      set category_id = p_target_category_id
      where category_id = p_category_id;
  else
    select coalesce(
      array_agg(products.image_path) filter (where products.image_path is not null),
      array[]::text[]
    )
      into v_product_images
      from public.products
      where products.category_id = p_category_id;

    delete from public.products
      where category_id = p_category_id;
  end if;

  delete from public.categories
    where id = p_category_id;

  v_media_paths := array_cat(
    v_product_images,
    case
      when v_category_image is null then array[]::text[]
      else array[v_category_image]
    end
  );

  return v_media_paths;
end;
$$;

revoke all on function public.admin_delete_category(uuid, text, uuid)
  from public, anon;
grant execute on function public.admin_delete_category(uuid, text, uuid)
  to authenticated;
