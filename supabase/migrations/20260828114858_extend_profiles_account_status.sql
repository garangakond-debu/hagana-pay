-- Extend profiles.account_status to support restricted and closed, keeping every existing
-- valid status (pending_verification, active, suspended, pending_pin).
alter table profiles drop constraint if exists profiles_account_status_check;
alter table profiles add constraint profiles_account_status_check
  check (account_status in ('pending_verification','pending_pin','active','restricted','suspended','closed'));