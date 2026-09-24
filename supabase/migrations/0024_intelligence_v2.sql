-- Vorexa Core v2.0 "Intelligence" (Phase 5). Weekly/Monthly Review tables
-- (same shape as the existing daily_reviews from 0020) and a Core
-- Assistant query log. Insights itself is computed live from existing
-- tables (accounts, transactions, tasks, habits, goals, net_worth_snapshots
-- etc.) the same way lib/watchlist.ts works — it needs no tables of its own.

create table weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  week_start date not null,
  wins_note text,
  challenges_note text,
  priorities_next_week text,
  overall_rating int check (overall_rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (owner_id, week_start)
);

create table monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  review_month date not null,
  net_worth_note text,
  spending_note text,
  goals_note text,
  focus_next_month text,
  overall_rating int check (overall_rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (owner_id, review_month)
);

-- Core Assistant: a log of natural-language Q&A over the user's own data,
-- so past answers can be revisited. The assistant itself is stateless per
-- request (lib/assistant.ts summarises live data and calls Claude) — this
-- table only records what was asked and answered, never raw account data.
create table assistant_queries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);
create index assistant_queries_owner_created_idx on assistant_queries (owner_id, created_at desc);

alter table weekly_reviews enable row level security;
alter table monthly_reviews enable row level security;
alter table assistant_queries enable row level security;

create policy "weekly_reviews: owner full access" on weekly_reviews
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "monthly_reviews: owner full access" on monthly_reviews
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "assistant_queries: owner full access" on assistant_queries
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
