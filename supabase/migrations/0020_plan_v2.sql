-- Vorexa Core v2.0 "Daily OS" (Phase 1). Extends the Phase-0 ACE-rule tasks
-- table into the richer Plan model (status/priority/subtasks/scheduling)
-- without breaking existing rows: tier/done are kept and backfilled from,
-- so nothing that still reads them breaks while the app moves onto
-- priority/status. New tables support the focus timer and the evening
-- shutdown review.

alter table tasks
  add column description text,
  add column priority text,
  add column status text,
  add column due_date date,
  add column due_time time,
  add column estimated_minutes int,
  add column actual_minutes int not null default 0,
  add column parent_task_id uuid references tasks (id) on delete cascade,
  add column recurrence_rule text not null default 'none' check (recurrence_rule in ('none', 'daily', 'weekly', 'monthly')),
  add column tags text[] not null default '{}',
  add column notes text,
  add column is_today_priority boolean not null default false,
  add column position int not null default 0,
  add column scheduled_event_id uuid references events (id) on delete set null;

update tasks set
  priority = case tier when 'critical' then 'critical' when 'important' then 'high' else 'normal' end,
  status = case when done then 'complete' else 'planned' end,
  due_date = task_date
where priority is null;

alter table tasks
  alter column priority set not null,
  alter column priority set default 'normal',
  add constraint tasks_priority_check check (priority in ('critical', 'high', 'normal', 'low')),
  alter column status set not null,
  alter column status set default 'planned',
  add constraint tasks_status_check check (status in ('inbox', 'planned', 'in_progress', 'waiting', 'complete', 'cancelled')),
  alter column tier drop not null;

create index tasks_owner_status_idx on tasks (owner_id, status);
create index tasks_owner_due_idx on tasks (owner_id, due_date);
create index tasks_parent_idx on tasks (parent_task_id);

create table task_focus_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  task_id uuid not null references tasks (id) on delete cascade,
  mode text not null default 'stopwatch' check (mode in ('stopwatch', '25', '50', 'custom')),
  planned_minutes int,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index task_focus_sessions_task_idx on task_focus_sessions (task_id);

-- One row per day per owner — the evening shutdown review. Morning review
-- doesn't need its own table: it just sets is_today_priority/estimated
-- minutes/due_date directly on tasks.
create table daily_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  review_date date not null default (now() at time zone 'Africa/Johannesburg')::date,
  completed_note text,
  carried_forward_note text,
  expense_note text,
  general_note text,
  overall_rating int check (overall_rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (owner_id, review_date)
);

alter table task_focus_sessions enable row level security;
alter table daily_reviews enable row level security;

create policy "task_focus_sessions: owner full access" on task_focus_sessions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "daily_reviews: owner full access" on daily_reviews
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Universal Quick Capture: widen the type list for the new auto-filed and
-- triage capture kinds (Phase 1 scope only — mood/habit land with Phase 3).
alter table quick_captures drop constraint quick_captures_type_check;
alter table quick_captures add constraint quick_captures_type_check check (type in
  ('fuel', 'expense', 'weight', 'note', 'shopping_item',
   'task', 'appointment', 'reminder', 'debt_payment', 'vehicle_expense', 'pet_expense', 'general'));
