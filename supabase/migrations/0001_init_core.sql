-- Phase 0: shared foundation tables used by every module.
-- Single-user today; owner_id is kept explicit (rather than implied) so
-- Phase 6 household access can add non-owner grants without a schema change.

create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  privacy_blur boolean not null default false,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table entities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  kind text not null default 'personal' check (kind in ('personal', 'shared', 'company')),
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  color text,
  created_at timestamptz not null default now()
);

-- Drives the Today watchlist, calendar auto-events and the 04:30 digest.
-- record_table/record_id link back to the source row in whichever module
-- created the reminder, without that module needing to know about Today.
create table reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  module text not null check (module in
    ('today', 'health', 'money', 'calendar', 'vehicle', 'pets', 'notes', 'vault')),
  title text not null,
  detail text,
  due_at timestamptz,
  lead_time_days int not null default 0,
  severity text not null default 'ok' check (severity in ('ok', 'soon', 'overdue')),
  amount_at_risk numeric,
  threshold_amount numeric,
  status text not null default 'pending' check (status in ('pending', 'snoozed', 'done')),
  snooze_reason text,
  record_table text,
  record_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reminders_owner_due_idx on reminders (owner_id, due_at);
create index reminders_owner_status_idx on reminders (owner_id, status);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  bucket text not null,
  path text not null,
  filename text not null,
  content_type text,
  record_table text,
  record_id uuid,
  created_at timestamptz not null default now()
);

-- Append-only. Health and Vault views/exports/deletes are logged here per
-- the architecture doc; nothing ever updates or deletes a row in this table.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  action text not null check (action in ('view', 'create', 'update', 'delete', 'export')),
  table_name text not null,
  record_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  module text,
  source text not null default 'app' check (source in ('app', 'google')),
  google_event_id text,
  transport_needed boolean not null default false,
  transport_confirmed boolean not null default false,
  record_table text,
  record_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_owner_starts_idx on events (owner_id, starts_at);

-- Generic inbox for the quick-capture sheet. Later phases read unprocessed
-- rows and turn them into real fuel_logs / transactions / weight entries /
-- notes / list_items, then stamp processed_at; the capture UI never needs
-- to know which module will claim a given entry.
create table quick_captures (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type text not null check (type in ('fuel', 'expense', 'weight', 'note', 'shopping_item')),
  payload jsonb not null,
  captured_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table profiles enable row level security;
alter table entities enable row level security;
alter table tags enable row level security;
alter table reminders enable row level security;
alter table attachments enable row level security;
alter table audit_log enable row level security;
alter table events enable row level security;
alter table quick_captures enable row level security;

create policy "profiles: owner full access" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "entities: owner full access" on entities
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "tags: owner full access" on tags
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "reminders: owner full access" on reminders
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "attachments: owner full access" on attachments
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- audit_log is append-only: owner can insert and read, never update/delete.
create policy "audit_log: owner can read" on audit_log
  for select using (owner_id = auth.uid());
create policy "audit_log: owner can insert" on audit_log
  for insert with check (owner_id = auth.uid());

create policy "events: owner full access" on events
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "quick_captures: owner full access" on quick_captures
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Drop the old Property Management Dashboard's signup trigger: it points at
-- organization_invitations/organizations, which now live only under the
-- archive_property_mgmt_2026_09_21 schema, so it would error on next signup.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists archive_property_mgmt_2026_09_21.handle_new_user();

-- New auth.users row -> matching profiles row, so the app never has to
-- special-case "no profile yet".
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
