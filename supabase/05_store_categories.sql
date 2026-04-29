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

create table if not exists public.store_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  icon_name text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.store_categories add column if not exists owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade;
alter table public.store_categories add column if not exists name text not null default '';
alter table public.store_categories add column if not exists slug text not null default '';
alter table public.store_categories add column if not exists icon_name text;
alter table public.store_categories add column if not exists image_url text;
alter table public.store_categories add column if not exists sort_order integer not null default 0;
alter table public.store_categories add column if not exists is_active boolean not null default true;
alter table public.store_categories add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.store_categories add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists store_categories_owner_slug_key
  on public.store_categories(owner_id, slug);

create unique index if not exists store_categories_owner_name_key
  on public.store_categories(owner_id, lower(name));

create index if not exists store_categories_owner_sort_idx
  on public.store_categories(owner_id, sort_order asc, created_at asc);

drop trigger if exists store_categories_set_updated_at on public.store_categories;
create trigger store_categories_set_updated_at
before update on public.store_categories
for each row
execute function public.set_updated_at();

alter table public.store_categories enable row level security;

drop policy if exists "store_categories_select_public_active" on public.store_categories;
create policy "store_categories_select_public_active"
on public.store_categories
for select
to public
using (is_active = true);

drop policy if exists "store_categories_select_own" on public.store_categories;
create policy "store_categories_select_own"
on public.store_categories
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "store_categories_insert_own" on public.store_categories;
create policy "store_categories_insert_own"
on public.store_categories
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "store_categories_update_own" on public.store_categories;
create policy "store_categories_update_own"
on public.store_categories
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "store_categories_delete_own" on public.store_categories;
create policy "store_categories_delete_own"
on public.store_categories
for delete
to authenticated
using (owner_id = auth.uid());
