-- Extend the transfers ledger to carry fee and commission rows in the same flow,
-- and add the fee-schedule + fee-quote functions the send_money RPC and the app use.
-- The fee is ALWAYS computed database-side; the client never supplies it.

-- 1) Extend transfers.type to allow fee + commission record types.
alter table transfers drop constraint if exists transfers_type_check;
alter table transfers add constraint transfers_type_check check (
  type in ('transfer', 'transfer_received', 'transfer_fee', 'mtn_commission', 'hagana_commission')
);

-- 2) Fee schedule. Single source of truth, owned by the database.
--    For amounts 5,000 - 10,000 SSP: 2% fee. All other bands: 0 (extensible here).
create or replace function public.calculate_transfer_fee(p_amount numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount <= 0 then
    return 0;
  end if;
  if p_amount >= 5000 and p_amount <= 10000 then
    return round(p_amount * 0.02, 2);
  end if;
  return 0;
end;
$$;

-- 3) Public quote endpoint the confirmation screen uses to show the REAL fee and
--    total for a candidate amount. Read-only; SECURITY DEFINER so it works for the
--    signed-in caller without exposing any data beyond the fee.
create or replace function public.get_transfer_fee(p_amount numeric)
returns table (fee numeric, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare v_fee numeric;
begin
  v_fee := public.calculate_transfer_fee(p_amount);
  return query select v_fee, coalesce(p_amount, 0) + v_fee;
end;
$$;

revoke all on function public.calculate_transfer_fee(numeric) from public;
grant execute on function public.calculate_transfer_fee(numeric) to authenticated;
revoke all on function public.get_transfer_fee(numeric) from public;
grant execute on function public.get_transfer_fee(numeric) to authenticated;
