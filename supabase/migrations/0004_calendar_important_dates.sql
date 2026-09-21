create table important_dates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  recurrence text not null default 'yearly' check (recurrence in ('yearly', 'monthly')),
  month int check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  lead_days int[] not null default '{14,7,1}',
  notes text,
  created_at timestamptz not null default now()
);

alter table important_dates enable row level security;

create policy "important_dates: owner full access" on important_dates
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
