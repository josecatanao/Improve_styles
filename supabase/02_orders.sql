create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  delivery_address text,
  notes text,
  status text not null default 'pending', -- pending, processing, shipped, completed, cancelled
  total_price numeric(12,2) not null,
  total_items integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.store_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.store_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  sku text,
  color_name text,
  color_hex text,
  size text,
  price numeric(12,2) not null,
  quantity integer not null,
  image_url text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.store_orders enable row level security;
alter table public.store_order_items enable row level security;

-- Policies for orders
drop policy if exists "store_orders_select_own" on public.store_orders;
create policy "store_orders_select_own"
on public.store_orders
for select
to authenticated
using (auth.uid() = customer_id);

drop policy if exists "store_orders_insert_own" on public.store_orders;
create policy "store_orders_insert_own"
on public.store_orders
for insert
to authenticated
with check (auth.uid() = customer_id);

drop policy if exists "store_orders_insert_anon" on public.store_orders;
create policy "store_orders_insert_anon"
on public.store_orders
for insert
to anon
with check (true);

-- Policies for order items
drop policy if exists "store_order_items_select_own" on public.store_order_items;
create policy "store_order_items_select_own"
on public.store_order_items
for select
to authenticated
using (
  order_id in (
    select id from public.store_orders where customer_id = auth.uid()
  )
);

drop policy if exists "store_order_items_insert_own" on public.store_order_items;
create policy "store_order_items_insert_own"
on public.store_order_items
for insert
to authenticated
with check (
  order_id in (
    select id from public.store_orders where customer_id = auth.uid()
  )
);

drop policy if exists "store_order_items_insert_anon" on public.store_order_items;
create policy "store_order_items_insert_anon"
on public.store_order_items
for insert
to anon
with check (true);

-- Optional: If using service role for admin, no extra policy is strictly needed for selects,
-- but we can add a general read if you grant specific permissions. Service role bypasses RLS.
