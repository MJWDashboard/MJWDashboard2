-- Trigger-only function: block direct RPC calls (anon/authenticated) while
-- the trigger (which runs as the table owner, not a role) keeps working.
revoke execute on function public.handle_new_user() from anon, authenticated;
