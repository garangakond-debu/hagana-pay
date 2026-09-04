-- 🧱 PREREQUISITE for Migration #11 — correct Migration #8's ledger design.
--
-- PROBLEM : Migration #8 declared `reference` as the PRIMARY KEY, so it is
--           unique per row. But ONE transfer flow produces FIVE ledger rows
--           (transfer, transfer_fee, transfer_received, mtn_commission,
--           hagana_commission) that MUST share the same `reference`. Writing
--           the 2nd..5th rows would hit `duplicate key value violates unique
--           constraint "transfers_pkey"` (23505) and roll the whole transfer
--           back. The send_money RPC therefore can never succeed.
--
-- FIX     : Split two identities that were conflated into one column:
--             • `id`        → the per-row primary key (unique per ledger row).
--             • `reference` → the shared transfer-flow reference (NOT unique).
--
-- The same client reference still cannot create a second transfer, because the
-- send_money RPC checks `where reference = v_reference` BEFORE any mutation
-- (idempotency) and raises a conflict if a flow with that reference already
-- exists. `reference` is indexed for that lookup.
--
-- Safe to re-apply: every statement is guarded with `if exists` /
-- `add column if not exists`. RLS and the existing select policy are untouched.

-- 1) Add a per-row primary key on `id`.
alter table transfers add column if not exists id uuid;

-- Backfill any pre-existing rows (none exist in production; defensive guard).
update transfers set id = gen_random_uuid() where id is null;

alter table transfers alter column id set not null;

-- 2) Drop the OLD reference primary key, promote `id` to the new primary key.
alter table transfers drop constraint if exists transfers_pkey;
alter table transfers add constraint transfers_pkey primary key (id);

-- 3) `reference` is now a non-unique flow identifier — index it for the
--    idempotency lookup in send_money.
create index if not exists transfers_reference_idx on transfers (reference);

-- 4) DATABASE-ENFORCED idempotency under concurrency.
--    `if exists(...)` inside the send_money RPC is NOT enough: under READ
--    COMMITTED two simultaneous requests with the same client reference both
--    see "no rows" and both proceed. Enforce the invariant in the schema:
--    every transfer flow writes EXACTLY ONE row with `type = 'transfer'` (the
--    sender debit). A partial unique index on (reference) restricted to that
--    anchor row guarantees the same reference can never create a second flow —
--    the second concurrent insert violates this index (23505) and the whole
--    transaction rolls back, so money is never moved twice.
create unique index if not exists transfers_flow_unique_idx
  on transfers (reference)
  where type = 'transfer';

-- Recreate the previously defined helper indexes (idempotent).
create index if not exists transfers_user_id_idx on transfers (user_id);
create index if not exists transfers_reference_user_idx on transfers (reference, user_id);
create index if not exists transfers_counterparty_idx on transfers (counterparty);

-- NOTE: no new RLS policy is created here. The existing `transfers_select`
-- policy (auth.uid() = user_id, from Migration #8) already restricts users to
-- reading only the rows they own, and it carries over automatically to the
-- new columns. Nothing about row ownership changed.
