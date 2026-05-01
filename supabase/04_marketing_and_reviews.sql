-- 1. ALTER TABLE PRODUCTS (Add Featured and Old Price)
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists compare_at_price numeric(10,2);

-- 2. PRODUCT REVIEWS TABLE
create table if not exists public.product_reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references public.customer_profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for product_reviews
alter table public.product_reviews enable row level security;

-- Policies for product_reviews
-- Anyone can read reviews
drop policy if exists "Reviews are viewable by everyone" on public.product_reviews;
create policy "Reviews are viewable by everyone" 
  on public.product_reviews for select 
  using (true);

-- Customers can only insert reviews for themselves
drop policy if exists "Customers can insert their own reviews" on public.product_reviews;
create policy "Customers can insert their own reviews" 
  on public.product_reviews for insert 
  to authenticated
  with check (auth.uid() = customer_id);

-- Admins can delete reviews
drop policy if exists "Admins can delete any review" on public.product_reviews;
create policy "Admins can delete any review" 
  on public.product_reviews for delete 
  to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer'
  );


-- 3. STORE BANNERS TABLE
create table if not exists public.store_banners (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  link_url text,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for store_banners
alter table public.store_banners enable row level security;

-- Policies for store_banners
-- Anyone can view active banners
drop policy if exists "Banners are viewable by everyone" on public.store_banners;
create policy "Banners are viewable by everyone" 
  on public.store_banners for select 
  using (true);

-- Only admins can modify banners
drop policy if exists "Admins can manage banners" on public.store_banners;
create policy "Admins can manage banners" 
  on public.store_banners for all 
  to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer'
  );


-- 4. STORE SETTINGS TABLE
-- This table should realistically only have one row holding the global config
create table if not exists public.store_settings (
  id uuid default gen_random_uuid() primary key,
  homepage_layout jsonb not null default '["banners", "promotions", "featured", "category-nav"]'::jsonb,
  announcement_text text,
  announcement_link text,
  announcement_active boolean not null default false,
  announcement_background_color text not null default '#3483fa',
  store_name text not null default 'Improve Styles',
  store_logo_url text,
  brand_primary_color text not null default '#0f172a',
  brand_secondary_color text not null default '#e2e8f0',
  store_header_background_color text not null default '#ffffff',
  store_button_background_color text not null default '#ffffff',
  store_card_background_color text not null default '#ffffff',
  store_card_border_color text not null default '#e2e8f0',
  store_cart_button_color text not null default '#ffffff',
  dashboard_theme text not null default 'light' check (dashboard_theme in ('light', 'dark')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.store_settings add column if not exists announcement_background_color text not null default '#3483fa';
alter table public.store_settings add column if not exists store_name text not null default 'Improve Styles';
alter table public.store_settings add column if not exists store_logo_url text;
alter table public.store_settings add column if not exists brand_primary_color text not null default '#0f172a';
alter table public.store_settings add column if not exists brand_secondary_color text not null default '#e2e8f0';
alter table public.store_settings add column if not exists store_header_background_color text not null default '#ffffff';
alter table public.store_settings add column if not exists store_button_background_color text not null default '#ffffff';
alter table public.store_settings add column if not exists store_card_background_color text not null default '#ffffff';
alter table public.store_settings add column if not exists store_card_border_color text not null default '#e2e8f0';
alter table public.store_settings add column if not exists store_cart_button_color text not null default '#ffffff';
alter table public.store_settings add column if not exists dashboard_theme text not null default 'light';
alter table public.store_settings add column if not exists delivery_enabled boolean not null default true;
alter table public.store_settings add column if not exists pickup_enabled boolean not null default true;
alter table public.store_settings add column if not exists allow_shipping_other_states boolean not null default true;

-- Enable RLS for store_settings
alter table public.store_settings enable row level security;

-- Policies for store_settings
drop policy if exists "Settings are viewable by everyone" on public.store_settings;
create policy "Settings are viewable by everyone" 
  on public.store_settings for select 
  using (true);

drop policy if exists "Admins can manage settings" on public.store_settings;
create policy "Admins can manage settings" 
  on public.store_settings for all 
  to authenticated
  using (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer'
  )
  with check (
    coalesce(auth.jwt() -> 'user_metadata' ->> 'account_type', '') <> 'customer'
  );

-- Initialize the store_settings row if it doesn't exist
insert into public.store_settings (homepage_layout, announcement_active)
select '["banners", "promotions", "featured", "category-nav"]'::jsonb, false
where not exists (select 1 from public.store_settings);
