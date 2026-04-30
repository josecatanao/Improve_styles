-- Add wishlist column to customer_profiles
alter table customer_profiles add column if not exists wishlist jsonb default '[]'::jsonb;
