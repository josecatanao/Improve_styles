alter table public.store_orders
add column if not exists payment_status text not null default 'pending';

update public.store_orders
set payment_status = case
  when status = 'completed' then 'paid'
  when status = 'cancelled' then 'cancelled'
  else 'pending'
end
where payment_status is null
   or payment_status = 'pending';
