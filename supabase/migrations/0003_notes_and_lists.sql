create table notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  body text not null default '',
  folder text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_owner_pinned_idx on notes (owner_id, pinned desc, updated_at desc);

create table lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  kind text not null default 'shopping' check (kind in
    ('shopping', 'household', 'pharmacy', 'pet_supplies', 'hardware', 'other')),
  created_at timestamptz not null default now()
);

create table list_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  list_id uuid not null references lists (id) on delete cascade,
  name text not null,
  quantity text,
  checked boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index list_items_list_idx on list_items (list_id, position);

alter table notes enable row level security;
alter table lists enable row level security;
alter table list_items enable row level security;

create policy "notes: owner full access" on notes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "lists: owner full access" on lists
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "list_items: owner full access" on list_items
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
