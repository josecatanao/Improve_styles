-- Allow customers to update their own pending orders to cancelled
create policy "Customers can cancel own pending orders"
  on store_orders
  for update
  to authenticated
  using (customer_id = auth.uid() and status = 'pending')
  with check (customer_id = auth.uid() and status = 'cancelled');
