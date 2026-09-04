-- Tighten wallets RLS: clients may only SELECT their own wallet.
-- Wallet balance changes are performed ONLY inside SECURITY DEFINER RPCs
-- (e.g. send_money), which bypass RLS. Direct UPDATE/DELETE from the client
-- is now disallowed at the policy level.
drop policy if exists wallets_insert on wallets;
drop policy if exists wallets_update on wallets;
drop policy if exists wallets_delete on wallets;
