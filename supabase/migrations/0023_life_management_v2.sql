-- Vorexa Core v2.0 "Life Management" (Phase 4). New Goals, Life Admin,
-- Home and Travel entities, plus light Notes/Vault enhancements. Existing
-- `trips` (vehicle mileage log) is untouched — travel_trips below is a
-- distinct concept (an actual holiday/trip), not a rename.

create table goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  purpose text,
  area text not null default 'personal' check (area in
    ('personal', 'financial', 'wellness', 'career', 'home', 'travel', 'creative', 'learning', 'other')),
  target text,
  deadline date,
  status text not null default 'active' check (status in ('planned', 'active', 'paused', 'complete', 'abandoned')),
  next_action text,
  linked_savings_goal_id uuid references savings_goals (id) on delete set null,
  created_at timestamptz not null default now()
);

create table goal_milestones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  goal_id uuid not null references goals (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table tasks add column goal_id uuid references goals (id) on delete set null;
alter table habits add column goal_id uuid references goals (id) on delete set null;

-- Life Admin: passports, licences, insurance, warranties, memberships,
-- contracts, subscriptions, tax deadlines, policy reviews, anniversaries,
-- document expiries — one register with configurable alert lead times.
create table life_admin_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  category text not null default 'other' check (category in
    ('passport', 'drivers_licence', 'vehicle_licence', 'insurance', 'warranty',
     'membership', 'contract', 'subscription', 'tax', 'policy_review', 'anniversary', 'document', 'other')),
  due_date date,
  lead_days int[] not null default '{90,60,30,7}',
  status text not null default 'current' check (status in ('current', 'due_soon', 'action_required', 'expired', 'complete')),
  notes text,
  created_at timestamptz not null default now()
);
create index life_admin_items_owner_due_idx on life_admin_items (owner_id, due_date);

-- Home: maintenance/repair register and emergency/service contacts.
-- Utilities and recurring service costs reuse recurring_expenses (Phase 2)
-- rather than duplicating a second recurring-cost table; household
-- appliances/assets reuse the existing `assets` table (Phase 0).
create table home_maintenance (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  item text not null,
  issue text,
  date_reported date not null default current_date,
  contractor text,
  cost numeric,
  status text not null default 'open' check (status in ('open', 'scheduled', 'complete')),
  next_service_date date,
  created_at timestamptz not null default now()
);

create table home_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  role text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

-- Travel: actual trips (not the Vehicle module's mileage `trips` table).
create table travel_trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  destination text not null,
  start_date date,
  end_date date,
  budget numeric,
  status text not null default 'planned' check (status in ('planned', 'booked', 'in_progress', 'complete', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table travel_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  trip_id uuid not null references travel_trips (id) on delete cascade,
  kind text not null default 'checklist' check (kind in ('booking', 'itinerary', 'checklist', 'document', 'expense')),
  title text not null,
  detail text,
  cost numeric,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Notes: `archived` and `category` already exist (0012). Widen category
-- for the Phase 4 note types rather than adding a second, overlapping
-- classification column, and add tags/favourite. Personal Journal reuses
-- this table with category='journal' rather than a parallel table, since
-- the shape (date, entry/body, tags) is ~90% the same and journal entries
-- benefit from living alongside other notes in search/folders.
alter table notes drop constraint notes_category_check;
alter table notes add constraint notes_category_check check (category in
  ('note', 'recipe', 'song', 'message', 'idea',
   'checklist', 'journal', 'reference', 'decision', 'travel_note'));
alter table notes
  add column tags text[] not null default '{}',
  add column favourite boolean not null default false;

-- Vault: a constrained category alongside the existing free-text doc_type,
-- so documents can be grouped the way the spec expects without breaking
-- what's already on file (doc_type keeps the specific label, e.g. "ID
-- book"; category is the broad bucket, e.g. "identity").
alter table documents
  add column category text not null default 'other' check (category in
    ('identity', 'finance', 'insurance', 'tax', 'vehicle', 'property', 'medical',
     'estate', 'employment', 'contracts', 'pets', 'travel', 'receipts', 'other'));

alter table goals enable row level security;
alter table goal_milestones enable row level security;
alter table life_admin_items enable row level security;
alter table home_maintenance enable row level security;
alter table home_contacts enable row level security;
alter table travel_trips enable row level security;
alter table travel_items enable row level security;

create policy "goals: owner full access" on goals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "goal_milestones: owner full access" on goal_milestones
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "life_admin_items: owner full access" on life_admin_items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "home_maintenance: owner full access" on home_maintenance
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "home_contacts: owner full access" on home_contacts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "travel_trips: owner full access" on travel_trips
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "travel_items: owner full access" on travel_items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
