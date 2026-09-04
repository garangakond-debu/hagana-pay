-- Secure account-security record (PIN hash only — never plaintext), keyed by the
-- authenticated user. The PIN is hashed server-side (bcrypt) by the API layer.
create table if not exists user_security (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text not null,
  pin_set_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_security enable row level security;

-- A user may read ONLY their own security record.
drop policy if exists user_security_select on user_security;
create policy user_security_select on user_security for select using (auth.uid() = user_id);

-- 🔒 Locked down: no client INSERT / UPDATE / DELETE on user_security.
-- PIN hashes are written ONLY by the trusted server (api/index.js /pin route runs
-- as service role and bypasses RLS). No client may create, replace, or delete a
-- PIN credential — that would enable PIN-minting and PIN-replacement attacks.
-- Write policies are intentionally NOT created.

-- The primary SSP wallet for the authenticated user. Balance starts at 0 — no demo money.
create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null default 'SSP',
  balance numeric(16,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Exactly one wallet per currency per user — prevents duplicate wallets on retry.
  constraint wallets_user_currency_key unique (user_id, currency)
);

create index if not exists wallets_user_id_idx on wallets(user_id);

alter table wallets enable row level security;

-- A user may read ONLY their own wallet.
drop policy if exists wallets_select on wallets;
create policy wallets_select on wallets for select using (auth.uid() = user_id);

-- 🔒 Locked down: no client INSERT / UPDATE / DELETE on wallets.
-- Wallet balances change ONLY through trusted SECURITY DEFINER financial
-- operations (e.g. the send_money RPC with server-side fee + idempotency),
-- never directly by the app. Write policies are intentionally NOT created.

-- Keep updated_at in sync on both tables.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_security_set_updated_at on user_security;
create trigger user_security_set_updated_at before update on user_security
  for each row execute function set_updated_at();

drop trigger if exists wallets_set_updated_at on wallets;
create trigger wallets_set_updated_at before update on wallets
  for each row execute function set_updated_at();
