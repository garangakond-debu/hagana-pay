-- Profile photo (optional) for displaying recipients. Never stores KYC or any
-- private document — just a display avatar URL.
alter table profiles add column if not exists avatar_url text;

-- ── Secure recipient search ────────────────────────────────────────────────
-- Searches Hagana Pay users by Hagana ID or name for the Send Money flow.
-- SECURITY DEFINER + fixed search_path so we control exactly what is exposed:
-- only the caller's id, full_name, hagana_id, avatar_url and account_status
-- are read, and the result returns ONLY the minimum projection needed to
-- identify a recipient. No phone, email, PIN, balance, KYC, or private fields
-- ever leave the function.
create or replace function search_recipients(search text)
returns table (
  id uuid,
  full_name text,
  hagana_id text,
  avatar_url text,
  account_status text
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.hagana_id, p.avatar_url, p.account_status
  from profiles p
  where p.account_status in ('active', 'pending_pin')
    and p.id <> auth.uid()
    and (
      p.hagana_id ilike '%' || search || '%'
      or p.full_name ilike '%' || search || '%'
    )
  order by p.full_name
  limit 20;
$$;

revoke all on function search_recipients(text) from public;
grant execute on function search_recipients(text) to authenticated;