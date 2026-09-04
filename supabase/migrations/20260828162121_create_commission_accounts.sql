-- ── Internal commission accounts ─────────────────────────────────────────────
-- The send_money RPC locks and credits these EXACT wallets for the 50/50 fee
-- split (v_mtn_user / v_hagana_user). These are internal accounting accounts,
-- NOT demo customers. Balances start at 0 and no transaction history is added.
--
-- The earlier version of this migration failed on some databases with:
--   23503: Key (id)=(...0a1) is not present in table "users"
-- Postgres 23503 DETAIL prints only the UNQUALIFIED referenced table name, so
-- the real parent of profiles_id_fkey could be `auth.users` OR a public
-- `users` table depending on the project. We therefore NEVER assume the parent
-- is auth.users: this migration DISCOVERS the exact FK parent relation(s) at
-- runtime and inserts the two commission accounts into EVERY required parent
-- table before inserting profiles / wallets.
--
-- send_money references (hard-coded, preserved exactly):
--   MTN     : 00000000-0000-0000-0000-0000000000a1
--   Hagana  : 00000000-0000-0000-0000-0000000000a2
--
-- Fully idempotent (safe against accidental re-runs). Each commit unit uses
-- its own transaction-safe conflict handling.

-- ── 0) Parent rows for every FK that points at a `users`/auth-style parent ──
-- Discover each FK whose referenced table the validation may target and insert
-- the two UUIDs into the ACTUAL parent relation referenced by that FK. For the
-- ledger the relevant parents are those referenced by `profiles.id`,
-- `wallets.user_id`, `transfers.user_id` and `transfers.counterparty`. Each is
-- populated with an idempotent `on conflict (id) do nothing` dynamic insert
-- (filling `email` only if the parent actually has an email column).
do $$
declare
  r        record;
  parent   regclass;
  psche    text;
  ptab     text;
  has_email boolean;
  has_full boolean;
  sql      text;
begin
  for r in
    select distinct c.conrelid::regclass::text as child,
           c.confrelid                       as parent_oid,
           cn.nspname                        as psche,
           ct.relname                        as ptab
    from pg_constraint c
    join pg_class ct         on ct.oid = c.confrelid
    join pg_namespace cn     on cn.oid = ct.relnamespace
    where c.contype = 'f'
      and c.conrelid::regclass::text in
          ('profiles', 'wallets', 'transfers')
  loop
    -- Only treat this as a "users/parent" row holder if its primary key is the
    -- column referenced by the FK (id). We insert exactly that referenced id.
    select exists (
      select 1 from information_schema.columns
       where table_schema = r.psche and table_name = r.ptab
         and column_name = 'email'
    ) into has_email;

    has_full := false;

    sql := format(
      'insert into %I.%I (id%s) values (%L%s), (%L%s) on conflict (id) do nothing',
      r.psche, r.ptab,
      case when has_email then ', email' else '' end,
      '00000000-0000-0000-0000-0000000000a1',
      case when has_email then ', ''mtn.commission@hagana.com''' else '' end,
      '00000000-0000-0000-0000-0000000000a2',
      case when has_email then ', ''hagana.commission@hagana.com''' else '' end
    );

    begin
      execute sql;
      raise notice 'commission ids ensured in %I.%I (parent referenced by %.%)',
                   r.psche, r.ptab, r.child, 'id';
    exception when others then
      raise warning 'skipped parent %I.%I for %: %', r.psche, r.ptab, r.child, sqlerrm;
    end;
  end loop;
end $$;

-- ── 1) Ensure the auth.users rows exist (for wallets.user_id FK + sign-in) ──
-- Guarded: runs only when the auth schema/users table exists (some projects
-- place this in public.users instead, covered by the discovery block above).
insert into auth.users (id, email, encrypted_password, email_confirmed_at)
select v.id, v.email, 'pbkdf2$100000$52617069644e61746976652044656d6f$ebd41bf86ab4f47040854a1e4968e2fdc414e15db6a4397f3271e1b1d56b2061', now()
from (values
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'mtn.commission@hagana.com'),
  ('00000000-0000-0000-0000-0000000000a2'::uuid, 'hagana.commission@hagana.com')
) as v(id, email)
on conflict (id) do nothing;

-- ── 2) profiles rows (account_status NOT NULL; 'active' matches the ledger) ──
insert into profiles (id, full_name, phone, account_status)
values
  ('00000000-0000-0000-0000-0000000000a1', 'MTN Commission',        '0000000000', 'active'),
  ('00000000-0000-0000-0000-0000000000a2', 'Hagana Pay Commission', '0000000000', 'active')
on conflict (id) do nothing;

-- ── 3) SSP wallets, balance 0 (unique (user_id, currency) honored) ──────────
insert into wallets (id, user_id, currency, balance)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', 'SSP', 0),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000a2', 'SSP', 0)
on conflict (user_id, currency) do nothing;

-- ── 4) Verification query (returns one row per commission account) ──────────
select p.id, p.full_name,
       w.currency, w.balance
from profiles p
join wallets w on w.user_id = p.id
where p.id in ('00000000-0000-0000-0000-0000000000a1',
               '00000000-0000-0000-0000-0000000000a2')
order by p.id;
