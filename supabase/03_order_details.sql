alter table public.store_orders add column if not exists delivery_method text not null default 'delivery';
alter table public.store_orders add column if not exists payment_method text not null default 'pix';
alter table public.store_orders add column if not exists installments integer not null default 1;
alter table public.store_orders add column if not exists delivery_lat numeric(10,8);
alter table public.store_orders add column if not exists delivery_lng numeric(11,8);

-- Also add to customer_profiles to save preferences
alter table public.customer_profiles add column if not exists default_delivery_method text;
alter table public.customer_profiles add column if not exists default_payment_method text;
alter table public.customer_profiles add column if not exists delivery_lat numeric(10,8);
alter table public.customer_profiles add column if not exists delivery_lng numeric(11,8);
