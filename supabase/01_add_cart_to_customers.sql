alter table public.customer_profiles add column if not exists cart jsonb not null default '[]'::jsonb;
