-- OAuth tokens, plain text for now — same caveat as Vault's reference
-- numbers: protected by RLS only, not field-encrypted. One row per owner
-- since this is a single-user app; unique constraint keeps it that way.
create table google_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  google_email text,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  scope text not null,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_id)
);

alter table google_accounts enable row level security;

create policy "google_accounts: owner full access" on google_accounts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
