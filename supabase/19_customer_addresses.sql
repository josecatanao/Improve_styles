-- Multi-address support: separate customer_addresses table
-- Replaces the single-address columns on customer_profiles

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  label text,
  street text not null default '',
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zip_code text,
  reference text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  gps_captured_at timestamptz,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_addresses_customer_id_idx
  on public.customer_addresses(customer_id);

drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
  for each row
  execute function public.set_updated_at();

alter table public.customer_addresses enable row level security;

drop policy if exists "customer_addresses_select_own" on public.customer_addresses;
create policy "customer_addresses_select_own"
  on public.customer_addresses
  for select
  to authenticated
  using (auth.uid() = customer_id);

drop policy if exists "customer_addresses_insert_own" on public.customer_addresses;
create policy "customer_addresses_insert_own"
  on public.customer_addresses
  for insert
  to authenticated
  with check (auth.uid() = customer_id);

drop policy if exists "customer_addresses_update_own" on public.customer_addresses;
create policy "customer_addresses_update_own"
  on public.customer_addresses
  for update
  to authenticated
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

drop policy if exists "customer_addresses_delete_own" on public.customer_addresses;
create policy "customer_addresses_delete_own"
  on public.customer_addresses
  for delete
  to authenticated
  using (auth.uid() = customer_id);


-- Migrate existing address data from customer_profiles into customer_addresses
-- Only insert where there is actual address content
insert into public.customer_addresses (customer_id, street, number, complement, neighborhood, city, state, zip_code, reference, latitude, longitude, gps_captured_at, is_primary)
select
  id as customer_id,
  delivery_address as street,
  delivery_house_number as number,
  delivery_complement as complement,
  delivery_neighborhood as neighborhood,
  delivery_city as city,
  delivery_state as state,
  delivery_zip_code as zip_code,
  delivery_reference as reference,
  delivery_lat as latitude,
  delivery_lng as longitude,
  delivery_gps_captured_at as gps_captured_at,
  true as is_primary
from public.customer_profiles
where
  delivery_address is not null
  or delivery_house_number is not null
  or delivery_zip_code is not null
  or delivery_city is not null;


-- Add delivery_address_id to store_orders to track which address was used
alter table public.store_orders
  add column if not exists delivery_address_id uuid;
