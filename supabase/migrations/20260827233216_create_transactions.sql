create table if not exists transactions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('deposit','withdrawal','merchant_payment','loan_repayment','transfer_received','transfer_sent')),
  amount numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on transactions(user_id);

alter table transactions enable row level security;

-- Users may read ONLY their own transaction history.
drop policy if exists transactions_select on transactions;
create policy transactions_select on transactions for select using (auth.uid() = user_id);

-- 🔒 Locked down: no client INSERT / UPDATE / DELETE.
-- Financial transaction records are created only by trusted server-side
-- (SECURITY DEFINER) operations, never directly by the app.
-- Write policies are intentionally NOT created.
