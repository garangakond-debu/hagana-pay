-- ── send_money — secure, atomic, idempotent SSP transfer ───────────────────
-- The database is the sole authority for money movement. The client only supplies
-- the recipient id, the amount, and a client-generated idempotency reference.
-- auth.uid() determines the sender — a frontend-supplied user/wallet id is NEVER
-- trusted. Balances are read-locked and mutated server-side only; the function
-- validates everything, performs an atomic debit+credit, and writes both ledger
-- rows (or none) under one reference.
create or replace function public.send_money(
  p_recipient_id uuid,
  p_amount numeric,
  p_client_ref text
)
returns table (reference text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender uuid := auth.uid();
  v_sender_wallet wallets%rowtype;
  v_recipient_wallet wallets%rowtype;
  v_sender_status text;
  v_recipient_status text;
  v_reference text;
  v_existing text;
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

  -- 1) Idempotency: if a flow already used this reference, the money already moved.
  --    Return the prior result instead of moving it again.
  select reference into v_existing
  from transfers
  where reference = v_reference
  limit 1;
  if found then
    return query select t.reference, t.status
                  from transfers t
                  where t.reference = v_reference
                  limit 1;
    return;
  end if;

  -- 2) Account status checks (recipient must be a real, active person).
  select account_status into v_recipient_status
  from profiles where id = p_recipient_id;
  if not found then
    raise exception 'ERR_RECIPIENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_recipient_status not in ('active', 'pending_pin') then
    raise exception 'ERR_RECIPIENT_UNAVAILABLE' using errcode = 'P0001';
  end if;

  -- 3) Lock the sender's SSP wallet and sanity-check availability.
  select * into v_sender_wallet
  from wallets
  where user_id = v_sender and currency = 'SSP'
  for update;
  if not found then
    raise exception 'ERR_NO_SENDER_WALLET' using errcode = 'P0001';
  end if;
  if v_sender_wallet.balance < p_amount then
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

  -- 5) Atomic debit + credit. The numeric guard is a second line of defense
  --    against racing readers even though the row is locked above.
  update wallets
  set balance = balance - p_amount
  where user_id = v_sender and currency = 'SSP'
    and balance >= p_amount;
  if not found then
    raise exception 'ERR_INSUFFICIENT_BALANCE' using errcode = 'P0001';
  end if;

  update wallets
  set balance = balance + p_amount
  where user_id = p_recipient_id and currency = 'SSP';
  if not found then
    raise exception 'ERR_NO_RECIPIENT_WALLET' using errcode = 'P0001';
  end if;

  -- 6) Write BOTH ledger rows under the same reference. Inserts, not upserts,
  --    because the idempotency guard above already proved no prior flow exists.
  insert into transfers (reference, user_id, counterparty, direction, type, amount, currency, status)
  values
    (v_reference, v_sender,        p_recipient_id, 'debit',  'transfer',         p_amount, 'SSP', 'completed'),
    (v_reference, p_recipient_id,  v_sender,       'credit', 'transfer_received', p_amount, 'SSP', 'completed');

  -- 7) Return the transaction reference + final status.
  return query select v_reference, 'completed'::text;
end;
$$;

revoke all on function public.send_money(uuid, numeric, text) from public;
grant execute on function public.send_money(uuid, numeric, text) to authenticated;
