create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  account_status text not null default 'pending_verification' check (account_status in ('pending_verification','active','suspended')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- A user may read ONLY their own profile.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (auth.uid() = id);

-- A user may create ONLY their own profile (the OTP verification upsert
-- needs INSERT so it can create the owner's row after sign-up).
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert with check (auth.uid() = id);

-- 🔒 Locked down: no client UPDATE or DELETE.
-- account_status / hagana_id and other sensitive profile fields must only
-- be changed by trusted server-side (SECURITY DEFINER) operations
-- (e.g. the PIN-hashing route flipping pending_pin -> active), not directly
-- by the app. Update and Delete policies are intentionally NOT created.
