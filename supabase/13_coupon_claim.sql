create or replace function public.claim_coupon_use(input_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(trim(input_code));
  affected_rows integer := 0;
begin
  if normalized_code is null or normalized_code = '' then
    return false;
  end if;

  update public.store_coupons
  set current_uses = coalesce(current_uses, 0) + 1
  where upper(trim(code)) = normalized_code
    and is_active = true
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
    and (max_uses is null or current_uses < max_uses);

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

grant execute on function public.claim_coupon_use(text) to anon, authenticated;
