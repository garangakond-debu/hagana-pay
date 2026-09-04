-- Rewrite of send_money: secure, atomic, idempotent SSP transfer WITH the
-- transfer fee model. The database computes the fee, the total sender debit,
-- and the 50/50 MTN / Hagana Pay commission split. The client never supplies
-- or is trusted for any of these values.
--
-- For a 10,000 SSP transfer this produces:
--   1) debit  sender SSP wallet    10,200  (transfer 10,000 + fee 200)
--   2) credit recipient SSP wallet 10,000
--   3) credit MTN commission wallet 100
--   4) credit Hagana Pay commission wallet 100
--   5) FIVE ledger rows under ONE flow `reference` (each row has its OWN `id`):
--        (row:  1, REF, sender,  debit,  'transfer'          , 10,000)
--        (row:  2, REF, sender,  debit,  'transfer_fee'      ,    200)
--        (row:  3, REF, recip,   credit, 'transfer_received' , 10,000)
--        (row:  4, REF, MTN,     credit, 'mtn_commission'    ,    100)
--        (row:  5, REF, hagana,  credit, 'hagana_commission' ,    100)
--
-- REQUIRES the prerequisite transfers-ledger migration that made `id` the
-- primary key and demoted `reference` to a non-unique flow reference.

drop function if exists public.send_money(uuid, numeric, text);

create or replace function public.send_money(
  p_recipient_id uuid,
  p_amount numeric,
  p_client_ref text
)
returns table (reference text, status text, fee numeric, total numeric, mtn_commission numeric, hagana_commission numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_sender_wallet wallets%rowtype;
  v_recipient_wallet wallets%rowtype;
  v_mtn_wallet wallets%rowtype;
  v_hagana_wallet wallets%rowtype;
  v_recipient_status text;
  v_reference text;
  v_fee numeric;
  v_total numeric;
  v_mtn numeric;
  v_hagana numeric;
  -- System commission accounts (created by migration #13, must exist).
  v_mtn_user uuid := '00000000-0000-0000-0000-0000000000a1';
  v_hagana_user uuid := '00000000-0000-0000-0000-0000000000a2';
begin
  -- 0) Basic input validation.
  if v_sender is null then
    raise exception 'ERR_UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  if p_recipient_id is null then
    raise exception 'ERR_NO_RECIPIENT' using errcode = 'P0001';
  end if;
  if p_recipient_id = v_sender then
    raise exception 'ERR_SELF_TRANSFER' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'ERR_INVALID_AMOUNT' using errcode = 'P0001';
  end if;
  if p_client_ref is null or length(trim(p_client_ref)) = 0
     or length(p_client_ref) > 40 then
    raise exception 'ERR_INVALID_REF' using errcode = 'P0001';
  end if;
  v_reference := trim(p_client_ref);

  -- The fee is computed by the database, never accepted from the client.
  v_fee := public.calculate_transfer_fee(p_amount);
  v_total := p_amount + v_fee;

  -- 1) Idempotency: if a flow already used this reference, the money already
  --    moved. Return the prior authoritative result instead of moving it again.
  --    `reference` is shared by FIVE ledger rows, so we must key the flow on
  --    the single anchor row — the sender's 'transfer' debit — not the bare
  --    reference (otherwise a fee/commission row would falsely trip the guard).
  if exists (select 1 from transfers
             where reference = v_reference and type = 'transfer') then
    return query select t.reference, t.status,
                         public.calculate_transfer_fee(t.amount),
                         t.amount + public.calculate_transfer_fee(t.amount),
                         floor(public.calculate_transfer_fee(t.amount) / 2),
                         public.calculate_transfer_fee(t.amount)
                           - floor(public.calculate_transfer_fee(t.amount) / 2)
                  from transfers t
                  where t.reference = v_reference
                    and t.direction = 'debit' and t.type = 'transfer'
                  limit 1;
    return;
  end if;

  -- 2) Recipient must be a real person in a state that can receive money.
  select account_status into v_recipient_status
  from profiles where id = p_recipient_id;
  if not found then
    raise exception 'ERR_RECIPIENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_recipient_status not in ('active', 'pending_pin') then
    raise exception 'ERR_RECIPIENT_UNAVAILABLE' using errcode = 'P0001';
  end if;

  -- 3) Lock the sender's SSP wallet.
  select * into v_sender_wallet
  from wallets
  where user_id = v_sender and currency = 'SSP'
  for update;
  if not found then
    raise exception 'ERR_NO_SENDER_WALLET' using errcode = 'P0001';
  end if;
  if v_sender_wallet.balance < v_total then
    raise exception 'ERR_INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  -- 4) Lock the recipient's SSP wallet (must exist).
  select * into v_recipient_wallet
  from wallets
  where user_id = p_recipient_id and currency = 'SSP'
  for update;
  if not found then
    raise exception 'ERR_NO_RECIPIENT_WALLET' using errcode = 'P0001';
  end if;

  -- 5) Lock the commission wallets (must be seeded by migration #13).
  select * into v_mtn_wallet
  from wallets where user_id = v_mtn_user and currency = 'SSP' for update;
  if not found then
    raise exception 'ERR_COMMISSION_ACCOUNT' using errcode = 'P0001';
  end if;
  select * into v_hagana_wallet
  from wallets where user_id = v_hagana_user and currency = 'SSP' for update;
  if not found then
    raise exception 'ERR_COMMISSION_ACCOUNT' using errcode = 'P0001';
  end if;

  -- 6) Split the fee 50/50; floor() protects against an odd fee amount.
  v_mtn := floor(v_fee / 2);
  v_hagana := v_fee - v_mtn;

  -- 7) Atomic debit + credits (all succeed together or roll back together).
  update wallets
  set balance = balance - v_total
  where user_id = v_sender and currency = 'SSP'
    and balance >= v_total;
  if not found then
    raise exception 'ERR_INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  update wallets
  set balance = balance + p_amount
  where user_id = p_recipient_id and currency = 'SSP';
  if not found then
    raise exception 'ERR_NO_RECIPIENT_WALLET' using errcode = 'P0001';
  end if;

  update wallets
  set balance = balance + v_mtn
  where user_id = v_mtn_user and currency = 'SSP';
  update wallets
  set balance = balance + v_hagana
  where user_id = v_hagana_user and currency = 'SSP';

  -- 8) Write ALL five ledger rows under the same flow `reference`, atomically.
  --    Each row has its OWN `id` primary key, so sharing `reference` is safe.
  --    Order for the exception guard: the 'transfer' anchor row is inserted
  --    FIRST so that, on a concurrent duplicate, the unique index
  --    `transfers_flow_unique_idx` (reference where type = 'transfer') fires
  --    and the whole statement (all wallet + ledger writes) rolls back before
  --    any other row under this reference is written.
  begin
    insert into transfers (id, reference, user_id, counterparty, direction, type, amount, currency, status)
    values
      (gen_random_uuid(), v_reference, v_sender,        p_recipient_id, 'debit',  'transfer',          p_amount, 'SSP', 'completed'),
      (gen_random_uuid(), v_reference, v_sender,        p_recipient_id, 'debit',  'transfer_fee',      v_fee,    'SSP', 'completed'),
      (gen_random_uuid(), v_reference, p_recipient_id,  v_sender,       'credit', 'transfer_received', p_amount, 'SSP', 'completed'),
      (gen_random_uuid(), v_reference, v_mtn_user,      v_sender,       'credit', 'mtn_commission',    v_mtn,    'SSP', 'completed'),
      (gen_random_uuid(), v_reference, v_hagana_user,   v_sender,       'credit', 'hagana_commission', v_hagana, 'SSP', 'completed');
  exception
    when unique_violation then
      -- Concurrent protection: under READ COMMITTED both requests pass the
      -- pre-check above (neither sees the other's uncommitted insert), so the
      -- SECOND multi-row insert hits `transfers_flow_unique_idx` (reference
      -- where type = 'transfer') on its anchor row. The whole transaction —
      -- every wallet update and all five ledger rows — rolled back as one, so
      -- money moved exactly once.
      --
      -- Do NOT blindly treat EVERY unique_violation as an idempotency
      -- collision — another constraint could theoretically raise it too. Only
      -- return the prior result if a committed 'transfer' anchor row for THIS
      -- reference truly exists; otherwise re-raise the original error.
      if exists (select 1 from transfers
                 where reference = v_reference and type = 'transfer') then
        return query select t.reference, t.status,
                             public.calculate_transfer_fee(t.amount),
                             t.amount + public.calculate_transfer_fee(t.amount),
                             floor(public.calculate_transfer_fee(t.amount) / 2),
                             public.calculate_transfer_fee(t.amount)
                               - floor(public.calculate_transfer_fee(t.amount) / 2)
                      from transfers t
                      where t.reference = v_reference
                        and t.direction = 'debit' and t.type = 'transfer'
                      limit 1;
        return;
      end if;
      -- The unique_violation did not come from the flow guard — raise it.
      raise;
  end;

  -- 9) Return the reference + the authoritative fee/total/commission split.
  return query select v_reference, 'completed'::text, v_fee, v_total, v_mtn, v_hagana;
end;
$$;

revoke all on function public.send_money(uuid, numeric, text) from public;
grant execute on function public.send_money(uuid, numeric, text) to authenticated;
