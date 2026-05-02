alter table public.store_settings add column if not exists store_address text;
alter table public.store_settings add column if not exists store_address_lat numeric(10,8);
alter table public.store_settings add column if not exists store_address_lng numeric(11,8);
