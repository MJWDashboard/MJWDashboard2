-- Vorexa Core v2.0 "Wellness" (Phase 3). New tables only — Medicines,
-- Appointments and weight (health_metrics) already exist from Phase 0 and
-- are extended in place by the Wellness dashboard, not replaced.

create table habits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  icon text not null default 'Circle',
  category text,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekdays', 'weekly', 'monthly', 'x_per_week', 'custom')),
  weekdays int[] not null default '{}', -- 0=Sun..6=Sat, used by weekdays/custom
  times_per_week int, -- used by x_per_week
  target int not null default 1,
  unit text,
  preferred_time time,
  reminder boolean not null default false,
  start_date date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  habit_id uuid not null references habits (id) on delete cascade,
  log_date date not null default current_date,
  completed boolean not null default true,
  skip_reason text,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);
create index habit_logs_habit_date_idx on habit_logs (habit_id, log_date desc);

-- One row per day per owner — the optional Daily Check-in. Every field is
-- nullable/optional per the spec ("make every field optional").
create table wellness_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  entry_date date not null default current_date,
  mood int check (mood between 1 and 5),
  energy int check (energy between 1 and 5),
  stress int check (stress between 1 and 5),
  sleep_quality int check (sleep_quality between 1 and 5),
  note text,
  symptoms text,
  gratitude text,
  highlight text,
  created_at timestamptz not null default now(),
  unique (owner_id, entry_date)
);

create table sleep_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  sleep_date date not null default current_date,
  bedtime time,
  wake_time time,
  duration_minutes int,
  quality int check (quality between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  unique (owner_id, sleep_date)
);

alter table profiles
  add column target_weight numeric,
  add column height_cm numeric;

alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table wellness_entries enable row level security;
alter table sleep_entries enable row level security;

create policy "habits: owner full access" on habits
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "habit_logs: owner full access" on habit_logs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "wellness_entries: owner full access" on wellness_entries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "sleep_entries: owner full access" on sleep_entries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Universal Quick Capture: mood and habit-log kinds land here per Phase 3.
alter table quick_captures drop constraint quick_captures_type_check;
alter table quick_captures add constraint quick_captures_type_check check (type in
  ('fuel', 'expense', 'weight', 'note', 'shopping_item',
   'task', 'appointment', 'reminder', 'debt_payment', 'vehicle_expense', 'pet_expense', 'general',
   'mood', 'habit_log'));
