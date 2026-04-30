-- Add free_shipping to discount_type enum (Postgres doesn't support ALTER TYPE easily, so recreate constraint)
alter table public.store_coupons drop constraint if exists store_coupons_discount_type_check;
alter table public.store_coupons add constraint store_coupons_discount_type_check 
  check (discount_type in ('percentage', 'fixed', 'free_shipping'));

-- Table: products linked to coupons
create table if not exists public.coupon_products (
  coupon_id uuid not null references public.store_coupons(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (coupon_id, product_id)
);

-- Table: categories linked to coupons
create table if not exists public.coupon_categories (
  coupon_id uuid not null references public.store_coupons(id) on delete cascade,
  category text not null,
  primary key (coupon_id, category)
);

-- RLS
alter table public.coupon_products enable row level security;
alter table public.coupon_categories enable row level security;

create policy "coupon_products_select_active" on public.coupon_products for select to public using (true);
create policy "coupon_categories_select_active" on public.coupon_categories for select to public using (true);

create policy "coupon_products_manage_admin" on public.coupon_products for all to authenticated using (coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer') with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer');
create policy "coupon_categories_manage_admin" on public.coupon_categories for all to authenticated using (coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer') with check (coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer');
