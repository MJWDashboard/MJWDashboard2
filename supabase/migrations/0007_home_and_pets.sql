create table pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  species text not null default 'dog' check (species in ('dog', 'cat', 'other')),
  breed text,
  estimated_age int,
  microchip text,
  insurer text,
  vet text,
  diet text,
  co_owners text,
  created_at timestamptz not null default now()
);

create table pet_care_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  pet_id uuid not null references pets (id) on delete cascade,
  kind text not null check (kind in
    ('vaccine', 'deworm', 'flea_tick', 'checkup', 'dental', 'grooming', 'medication')),
  label text not null,
  interval_days int,
  last_done date,
  next_due date,
  created_at timestamptz not null default now()
);

-- Cost split defaults 50/50 with Garth per the plan; settled visits become
-- budget transactions (left as a manual step for now, not auto-posted).
create table pet_visits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  pet_id uuid not null references pets (id) on delete cascade,
  occurred_at date not null default current_date,
  reason text,
  diagnosis text,
  treatment text,
  cost numeric not null default 0,
  paid_by text not null default 'owner' check (paid_by in ('owner', 'garth')),
  split_pct int not null default 50 check (split_pct between 0 and 100),
  settled boolean not null default false,
  weight_kg numeric,
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  entity_id uuid references entities (id) on delete set null,
  item text not null,
  category text,
  make text,
  model text,
  serial_number text,
  purchase_date date,
  purchase_price numeric,
  retailer text,
  location text,
  replacement_value numeric,
  warranty_expiry date,
  insured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table pets enable row level security;
alter table pet_care_items enable row level security;
alter table pet_visits enable row level security;
alter table assets enable row level security;

create policy "pets: owner full access" on pets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "pet_care_items: owner full access" on pet_care_items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "pet_visits: owner full access" on pet_visits
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "assets: owner full access" on assets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
