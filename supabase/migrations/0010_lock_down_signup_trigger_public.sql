-- The 0002 migration revoked execute from anon/authenticated directly, but
-- Postgres also grants execute to PUBLIC by default at function creation
-- time, which anon/authenticated inherit from — close that too.
revoke execute on function public.handle_new_user() from public;
