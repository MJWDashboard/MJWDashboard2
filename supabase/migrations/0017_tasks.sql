-- Today's "Tasks" capacity meter: 1 critical, 2 important, 3 admin per day,
-- resetting at local midnight (SAST). This is the ACE rule from the build
-- plan — small, finite, so the day never turns into an infinite backlog.
create table tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  tier text not null check (tier in ('critical', 'important', 'admin')),
  done boolean not null default false,
  task_date date not null default (now() at time zone 'Africa/Johannesburg')::date,
  created_at timestamptz not null default now()
);
create index tasks_owner_date_idx on tasks (owner_id, task_date);

alter table tasks enable row level security;

create policy "tasks: owner full access" on tasks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
