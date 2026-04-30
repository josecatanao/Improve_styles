-- Shipping zones table
create table if not exists shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zip_code_start text not null,
  zip_code_end text not null,
  base_price numeric(10,2) not null default 0,
  price_per_km numeric(10,2) default 0,
  free_shipping_threshold numeric(10,2) default null,
  estimated_days integer default 7,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- RLS
alter table shipping_zones enable row level security;

create policy "Anyone can read active shipping zones"
  on shipping_zones for select
  using (is_active = true);

-- Add shipping columns to store_orders
alter table public.store_orders add column if not exists shipping_cost numeric(10,2) default 0;
alter table public.store_orders add column if not exists shipping_zone_name text;
alter table public.store_orders add column if not exists shipping_zip text;
