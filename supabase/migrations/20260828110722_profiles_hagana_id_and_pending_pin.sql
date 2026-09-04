-- Add a real Hagana account ID that is generated and stored in the database
-- (never on the frontend), and extend account_status to support pending_pin.
alter table profiles add column if not exists hagana_id text;

-- Extend the account_status CHECK constraint to include pending_pin.
alter table profiles drop constraint if exists profiles_account_status_check;
alter table profiles add constraint profiles_account_status_check
  check (account_status in ('pending_verification','active','suspended','pending_pin'));

-- A Hagana ID is unique across all profiles.
create unique index if not exists profiles_hagana_id_key
  on profiles (hagana_id) where hagana_id is not null;

-- Generate a real Hagana ID at insert time in the database (never in the client).
create or replace function generate_hagana_id() returns trigger as $$
begin
  if new.hagana_id is null then
    loop
      new.hagana_id := 'HGN-' || lpad((floor(random() * 900000 + 100000))::int::text, 6, '0');
      exit when not exists (select 1 from profiles where hagana_id = new.hagana_id);
    end loop;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_hagana_id_before_insert on profiles;
create trigger set_hagana_id_before_insert before insert on profiles
  for each row execute function generate_hagana_id();