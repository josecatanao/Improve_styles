alter table public.customer_profiles
add column if not exists delivery_complement text;

alter table public.customer_profiles
add column if not exists delivery_house_number text;

alter table public.customer_profiles
add column if not exists delivery_neighborhood text;

alter table public.customer_profiles
add column if not exists delivery_zip_code text;

alter table public.customer_profiles
add column if not exists delivery_city text;

alter table public.customer_profiles
add column if not exists delivery_state text;

alter table public.customer_profiles
add column if not exists delivery_reference text;

alter table public.customer_profiles
add column if not exists delivery_gps_captured_at timestamptz;
