-- Note: reference/policy/account numbers below are stored as plain text,
-- protected only by RLS — real field-level encryption (per the architecture
-- doc's Phase 4 note) needs its own key-management design and is not yet
-- built. Don't treat this table as encrypted at rest.
create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  doc_type text not null,
  entity_id uuid references entities (id) on delete set null,
  issuer text,
  document_date date,
  expiry_date date,
  tax_year text,
  reference_number text,
  notes text,
  created_at timestamptz not null default now()
);

create table policies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  insurer text not null,
  kind text not null default 'other' check (kind in
    ('life', 'funeral', 'vehicle', 'household', 'medical_aid', 'other')),
  policy_number text,
  premium numeric,
  cover_amount numeric,
  renewal_date date,
  broker_contact text,
  beneficiary text,
  created_at timestamptz not null default now()
);

-- Register only — the account/2FA metadata, never the password itself.
create table credentials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  service text not null,
  username text,
  criticality text not null default 'tier2' check (criticality in ('tier1', 'tier2')),
  two_fa_method text,
  last_password_change date,
  recovery_email text,
  created_at timestamptz not null default now()
);

create table matters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  reference text,
  matter text not null,
  authority text,
  opened_date date not null default current_date,
  status text not null default 'open' check (status in ('open', 'closed')),
  last_contact date,
  next_action text,
  due_date date,
  created_at timestamptz not null default now()
);

alter table documents enable row level security;
alter table policies enable row level security;
alter table credentials enable row level security;
alter table matters enable row level security;

create policy "documents: owner full access" on documents
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "policies: owner full access" on policies
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "credentials: owner full access" on credentials
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "matters: owner full access" on matters
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
