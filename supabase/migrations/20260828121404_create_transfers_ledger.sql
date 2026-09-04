-- ── Money transfer ledger ────────────────────────────────────────────────────
-- ONE FLOW (a single money transfer) produces FIVE vertical ledger rows that
-- share the SAME flow `reference`:
--     1. transfer           (sender debit,   amount)        ← anchor row
--     2. transfer_fee       (sender debit,   fee)
--     3. transfer_received  (recipient credit, amount)
--     4. mtn_commission     (MTN credit,     50% of fee)
--     5. hagana_commission  (Hagana credit,  50% of fee)
-- Each row is owned by its own `user_id`, so RLS lets each participant read
-- only the rows they own (`auth.uid() = user_id`).
--
-- Scoring this table for the FIVE-row flow requires that `reference` is NOT
-- unique: it is a shared FLOW identifier, not a row identity. Each row instead
-- carries its OWN `id uuid` PRIMARY KEY. The `send_money` RPC (migration #11,
-- and its prerequisite #121405) is the only writer.
--
-- Idempotency under CONCURRENCY is enforced at the SCHEMA level: every flow
-- writes EXACTLY ONE row with `type = 'transfer'` (the sender-debit anchor).
-- The partial unique index `transfers_flow_unique_idx` on (reference) WHERE
-- type = 'transfer' guarantees the same client reference can never create a
-- second flow — a concurrent duplicate insert violates it (23505) and the
-- whole atomic transaction rolls back, so money is never moved twice.

create table if not exists transfers (
  id uuid,
  reference text,
  user_id uuid not null references auth.users(id) on delete cascade,
  counterparty uuid null references auth.users(id) on delete set null,
  direction text not null check (direction in ('debit', 'credit')),
  type text not null default 'transfer'
    check (type in ('transfer', 'transfer_fee', 'transfer_received',
                    'mtn_commission', 'hagana_commission')),
  amount numeric(16,2) not null check (amount > 0),
  currency text not null default 'SSP',
  status text not null default 'completed' check (status in ('completed', 'failed', 'reversed')),
  created_at timestamptz not null default now()
);

-- Backfill safety: if a prior deploy ever created rows under the older schema
-- (reference PK, no id column), each existing row gets its own UUID before `id`
-- is made the primary key. In a fresh build there are no rows — this is a
-- defensive guard for re-application over pre-existing data.
update transfers set id = gen_random_uuid() where id is null;

-- Every row must carry its own unique id → the primary key.
alter table transfers alter column id set not null;

-- `id` is the per-row primary key. Drop the legacy reference primary key (if a
-- prior version created one) only AFTER existing rows have valid `id` values,
-- so no data is lost when the new PK is promoted.
alter table transfers drop constraint if exists transfers_pkey;
alter table transfers add constraint transfers_pkey primary key (id);

-- `reference` is a shared flow identifier — explicitly NOT unique. Multiple
-- ledger rows (the five above) are allowed to share the same reference. Index
-- it for the fast idempotency lookup in send_money.
create index if not exists transfers_reference_idx on transfers (reference);

-- DATABASE-ENFORCED idempotency: one `transfer` anchor row per reference. The
-- five rows share a reference, but only ONE `type = 'transfer'` row may exist
-- for any given reference. A concurrent duplicate request (same client ref)
-- violates this partial unique index and rolls back atomically.
create unique index if not exists transfers_flow_unique_idx
  on transfers (reference)
  where type = 'transfer';

-- Helper lookup indexes (one per foreign key + the common flow listing).
create index if not exists transfers_user_id_idx on transfers(user_id);
create index if not exists transfers_reference_user_idx on transfers(reference, user_id);
create index if not exists transfers_counterparty_idx on transfers(counterparty);

alter table transfers enable row level security;

-- Smoothing over PG's RLS check-rule: the select policy is auth.uid() = user_id.
-- (The new `id` / `reference` columns inherit this ownership model unchanged.)
drop policy if exists transfers_select on transfers;
create policy transfers_select on transfers for select using (auth.uid() = user_id);
