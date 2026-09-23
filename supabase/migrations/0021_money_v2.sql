-- Vorexa Core v2.0 "Financial Core" (Phase 2). Extends the Phase-0 Money
-- schema (accounts/transactions/categories/budgets/debts) rather than
-- replacing it, and adds the new Phase 2 entities: recurring expenses,
-- savings goals, net worth snapshots, CSV import templates and
-- merchant->category memory.

alter table accounts drop constraint accounts_kind_check;
alter table accounts add constraint accounts_kind_check check (kind in
  ('cheque', 'savings', 'credit_card', 'business', 'loan', 'store_account',
   'investment', 'cash', 'tax_liability', 'other_asset', 'other_liability'));

alter table accounts
  add column institution text,
  add column credit_limit numeric,
  add column interest_rate numeric,
  add column payment_date int check (payment_date between 1 and 31),
  add column minimum_payment numeric,
  add column active boolean not null default true;

alter table transactions
  add column merchant text,
  add column payment_method text,
  add column recurring boolean not null default false,
  add column notes text,
  add column tags text[] not null default '{}',
  add column reviewed boolean not null default true;
create index transactions_owner_reviewed_idx on transactions (owner_id, reviewed) where not reviewed;

alter table categories
  add column hidden boolean not null default false,
  add column position int not null default 0,
  add column budget_group text not null default 'flexible' check (budget_group in ('fixed', 'flexible', 'savings_debt'));

create table recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  provider text not null,
  category_id uuid references categories (id) on delete set null,
  amount numeric not null,
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly', 'quarterly', 'annual')),
  next_due_date date,
  payment_method text,
  annual_increase_pct numeric,
  contract_end_date date,
  cancellation_notice_days int,
  active boolean not null default true,
  last_reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index recurring_expenses_owner_due_idx on recurring_expenses (owner_id, next_due_date);

create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  target_date date,
  monthly_contribution numeric,
  linked_account_id uuid references accounts (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'complete', 'paused')),
  created_at timestamptz not null default now()
);

create table net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  snapshot_month text not null,
  total_assets numeric not null,
  total_liabilities numeric not null,
  net_worth numeric not null,
  created_at timestamptz not null default now(),
  unique (owner_id, snapshot_month)
);

create table import_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  column_mapping jsonb not null,
  delimiter text not null default ',',
  date_format text not null default 'YYYY-MM-DD',
  created_at timestamptz not null default now()
);

create table merchant_category_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  merchant_pattern text not null,
  category_id uuid not null references categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (owner_id, merchant_pattern)
);

alter table recurring_expenses enable row level security;
alter table savings_goals enable row level security;
alter table net_worth_snapshots enable row level security;
alter table import_templates enable row level security;
alter table merchant_category_rules enable row level security;

create policy "recurring_expenses: owner full access" on recurring_expenses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "savings_goals: owner full access" on savings_goals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "net_worth_snapshots: owner full access" on net_worth_snapshots
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "import_templates: owner full access" on import_templates
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "merchant_category_rules: owner full access" on merchant_category_rules
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
