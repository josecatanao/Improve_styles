-- Coupons table
create table if not exists public.store_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  min_order_value numeric(10,2) default 0,
  max_uses integer default null,
  current_uses integer default 0,
  is_active boolean default true,
  starts_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists store_coupons_code_key
  on public.store_coupons(lower(code));

drop trigger if exists store_coupons_set_updated_at on public.store_coupons;
create trigger store_coupons_set_updated_at
before update on public.store_coupons
for each row
execute function public.set_updated_at();

alter table public.store_coupons enable row level security;

drop policy if exists "store_coupons_select_active" on public.store_coupons;
create policy "store_coupons_select_active"
on public.store_coupons
for select
to public
using (is_active = true and (expires_at is null or expires_at > now()));

drop policy if exists "store_coupons_manage_admin" on public.store_coupons;
create policy "store_coupons_manage_admin"
on public.store_coupons
for all
to authenticated
using (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer'
)
with check (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer'
);

-- Add coupon fields to orders
alter table public.store_orders add column if not exists coupon_code text;
alter table public.store_orders add column if not exists discount_amount numeric(12,2) default 0;
