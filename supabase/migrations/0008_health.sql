create table medicines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  strength text,
  dose_text text,
  schedule text[] not null default '{morning}',
  stock_on_hand int not null default 0,
  script_expiry date,
  repeats_left int,
  pharmacy text,
  monthly_collection_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- One row per medicine/day/time-slot actually ticked; an untouched slot is
-- simply absent, so "today's checklist" is derived (medicines x schedule)
-- minus what's already here, not a pre-populated table.
create table med_doses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  medicine_id uuid not null references medicines (id) on delete cascade,
  dose_date date not null default current_date,
  time_slot text not null,
  status text not null check (status in ('taken', 'skipped')),
  skip_reason text,
  created_at timestamptz not null default now(),
  unique (medicine_id, dose_date, time_slot)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  provider text not null,
  purpose text,
  appointment_at timestamptz not null,
  notes text,
  follow_up_date date,
  cost numeric,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table health_metrics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  metric text not null default 'weight',
  value numeric not null,
  unit text not null default 'kg',
  recorded_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table medicines enable row level security;
alter table med_doses enable row level security;
alter table appointments enable row level security;
alter table health_metrics enable row level security;

create policy "medicines: owner full access" on medicines
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "med_doses: owner full access" on med_doses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "appointments: owner full access" on appointments
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "health_metrics: owner full access" on health_metrics
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
