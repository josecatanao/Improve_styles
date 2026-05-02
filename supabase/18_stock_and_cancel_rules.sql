-- Drop old RLS policy for customer cancellation (from 07_customer_order_cancel.sql)
-- and recreate with expanded statuses (pending + processing)
drop policy if exists "Customers can cancel own pending orders" on store_orders;

-- Allow customers to cancel their own orders when status is pending or processing
create policy "Customers can cancel own pending orders"
  on store_orders
  for update
  to authenticated
  using (customer_id = auth.uid() and status in ('pending', 'processing'))
  with check (customer_id = auth.uid() and status = 'cancelled');
