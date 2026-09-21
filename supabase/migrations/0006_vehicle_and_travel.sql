create table vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  make text not null,
  model text not null,
  year int,
  registration text,
  fuel_type text not null default 'petrol' check (fuel_type in ('petrol', 'diesel', 'electric', 'hybrid')),
  odometer numeric not null default 0,
  registered_owner text,
  financier text,
  main_driver text,
  who_pays text,
  licence_disc_expiry date,
  warranty_end date,
  insurer text,
  created_at timestamptz not null default now()
);

create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  occurred_at date not null default current_date,
  litres numeric not null,
  price_per_litre numeric,
  total numeric not null,
  odometer numeric not null,
  full_tank boolean not null default true,
  station text,
  created_at timestamptz not null default now()
);
create index fuel_logs_vehicle_idx on fuel_logs (vehicle_id, occurred_at desc);

create table trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  occurred_at date not null default current_date,
  from_location text,
  to_location text,
  odometer_start numeric,
  odometer_end numeric,
  purpose text not null default 'private' check (purpose in ('business', 'private')),
  reimbursed boolean not null default false,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  occurred_at date not null default current_date,
  odometer numeric,
  provider text,
  work_done text,
  cost numeric,
  next_due_odometer numeric,
  next_due_date date,
  created_at timestamptz not null default now()
);

alter table vehicles enable row level security;
alter table fuel_logs enable row level security;
alter table trips enable row level security;
alter table services enable row level security;

create policy "vehicles: owner full access" on vehicles
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "fuel_logs: owner full access" on fuel_logs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "trips: owner full access" on trips
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "services: owner full access" on services
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
