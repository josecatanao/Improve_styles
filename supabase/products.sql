create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  sku text,
  colors jsonb not null default '[]'::jsonb,
  short_description text,
  description text,
  price numeric(12,2) not null default 0,
  compare_at_price numeric(12,2),
  cost_price numeric(12,2),
  stock integer not null default 0,
  status text not null default 'draft',
  category text,
  brand text,
  collection text,
  audience text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  is_new boolean not null default false,
  weight numeric(10,2),
  width numeric(10,2),
  height numeric(10,2),
  length numeric(10,2),
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.products add column if not exists sku text;
alter table public.products add column if not exists short_description text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists price numeric(12,2) not null default 0;
alter table public.products add column if not exists compare_at_price numeric(12,2);
alter table public.products add column if not exists cost_price numeric(12,2);
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists status text not null default 'draft';
alter table public.products add column if not exists category text;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists collection text;
alter table public.products add column if not exists audience text;
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists is_new boolean not null default false;
alter table public.products add column if not exists weight numeric(10,2);
alter table public.products add column if not exists width numeric(10,2);
alter table public.products add column if not exists height numeric(10,2);
alter table public.products add column if not exists length numeric(10,2);
alter table public.products add column if not exists is_active boolean not null default false;
alter table public.products add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.products add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
declare
  colors_udt text;
  tags_udt text;
begin
  select c.udt_name
  into colors_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'products'
    and c.column_name = 'colors';

  if colors_udt is null then
    execute 'alter table public.products add column colors jsonb not null default ''[]''::jsonb';
  elsif colors_udt = '_text' then
    execute $migration$
      alter table public.products
      alter column colors type jsonb
      using coalesce(
        (
          select jsonb_agg(
            jsonb_build_object('name', color_name, 'hex', '#000000')
          )
          from unnest(colors) as color_name
        ),
        '[]'::jsonb
      )
    $migration$;

    execute 'alter table public.products alter column colors set default ''[]''::jsonb';
    execute 'update public.products set colors = ''[]''::jsonb where colors is null';
    execute 'alter table public.products alter column colors set not null';
  end if;

  select c.udt_name
  into tags_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'products'
    and c.column_name = 'tags';

  if tags_udt is null then
    execute 'alter table public.products add column tags text[] not null default ''{}''';
  elsif tags_udt <> '_text' then
    execute 'alter table public.products drop column tags';
    execute 'alter table public.products add column tags text[] not null default ''{}''';
  end if;
end
$$;

update public.products
set status = case
  when is_active = true and coalesce(stock, 0) > 0 then 'active'
  when is_active = true and coalesce(stock, 0) <= 0 then 'out_of_stock'
  else 'draft'
end
where status is null or status not in ('draft', 'active', 'hidden', 'out_of_stock');

update public.products
set is_active = status = 'active';

alter table public.products
  drop constraint if exists products_status_check;

alter table public.products
  add constraint products_status_check
  check (status in ('draft', 'active', 'hidden', 'out_of_stock'));

create unique index if not exists products_owner_slug_key on public.products(owner_id, slug);
create index if not exists products_owner_created_at_idx on public.products(owner_id, created_at desc);
create index if not exists products_owner_status_idx on public.products(owner_id, status);
create index if not exists products_owner_category_idx on public.products(owner_id, category);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  color_name text not null,
  color_hex text not null,
  size text not null default 'Unico',
  sku text,
  stock integer not null default 0,
  price numeric(12,2),
  compare_at_price numeric(12,2),
  cost_price numeric(12,2),
  status text not null default 'active',
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.product_variants add column if not exists color_name text not null default 'Padrao';
alter table public.product_variants add column if not exists color_hex text not null default '#111111';
alter table public.product_variants add column if not exists size text not null default 'Unico';
alter table public.product_variants add column if not exists sku text;
alter table public.product_variants add column if not exists stock integer not null default 0;
alter table public.product_variants add column if not exists price numeric(12,2);
alter table public.product_variants add column if not exists compare_at_price numeric(12,2);
alter table public.product_variants add column if not exists cost_price numeric(12,2);
alter table public.product_variants add column if not exists status text not null default 'active';
alter table public.product_variants add column if not exists position integer not null default 0;
alter table public.product_variants add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.product_variants add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.product_variants
  drop constraint if exists product_variants_status_check;

alter table public.product_variants
  add constraint product_variants_status_check
  check (status in ('active', 'inactive'));

create unique index if not exists product_variants_product_option_key
  on public.product_variants(product_id, color_hex, size);

create index if not exists product_variants_product_position_idx
  on public.product_variants(product_id, position asc);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  public_url text,
  alt_text text,
  assigned_color_name text,
  assigned_color_hex text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.product_images add column if not exists assigned_color_name text;
alter table public.product_images add column if not exists assigned_color_hex text;

create index if not exists product_images_product_sort_idx
  on public.product_images(product_id, sort_order asc);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own"
on public.products
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
on public.products
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
on public.products
for delete
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "product_variants_select_own" on public.product_variants;
create policy "product_variants_select_own"
on public.product_variants
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "product_variants_insert_own" on public.product_variants;
create policy "product_variants_insert_own"
on public.product_variants
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "product_variants_update_own" on public.product_variants;
create policy "product_variants_update_own"
on public.product_variants
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "product_variants_delete_own" on public.product_variants;
create policy "product_variants_delete_own"
on public.product_variants
for delete
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "product_images_select_own" on public.product_images;
create policy "product_images_select_own"
on public.product_images
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "product_images_insert_own" on public.product_images;
create policy "product_images_insert_own"
on public.product_images
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "product_images_update_own" on public.product_images;
create policy "product_images_update_own"
on public.product_images
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "product_images_delete_own" on public.product_images;
create policy "product_images_delete_own"
on public.product_images
for delete
to authenticated
using (auth.uid() = owner_id);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_bucket_read_public" on storage.objects;
create policy "product_images_bucket_read_public"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

drop policy if exists "product_images_bucket_insert_own" on storage.objects;
create policy "product_images_bucket_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "product_images_bucket_update_own" on storage.objects;
create policy "product_images_bucket_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'product-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "product_images_bucket_delete_own" on storage.objects;
create policy "product_images_bucket_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);
