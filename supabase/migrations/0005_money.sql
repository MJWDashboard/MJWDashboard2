create table accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  kind text not null check (kind in
    ('cheque', 'savings', 'credit_card', 'business', 'loan', 'store_account')),
  is_cash boolean not null default true,
  entity_id uuid references entities (id) on delete set null,
  opening_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  created_at timestamptz not null default now()
);

-- amount is signed: positive = inflow, negative = outflow. An account's
-- current balance is opening_balance + sum(transactions.amount).
create table transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  account_id uuid not null references accounts (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  entity_id uuid references entities (id) on delete set null,
  description text not null default '',
  amount numeric not null,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index transactions_owner_account_idx on transactions (owner_id, account_id, occurred_at desc);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  category_id uuid not null references categories (id) on delete cascade,
  month text not null,
  planned_amount numeric not null,
  created_at timestamptz not null default now(),
  unique (owner_id, category_id, month)
);

create table debts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  creditor text not null,
  kind text not null default 'credit_card' check (kind in
    ('credit_card', 'store_account', 'personal_loan', 'vehicle_finance', 'other')),
  balance numeric not null default 0,
  interest_rate numeric,
  minimum_payment numeric,
  due_day int check (due_day between 1 and 31),
  limit_amount numeric,
  status text not null default 'active' check (status in ('active', 'settled')),
  created_at timestamptz not null default now()
);

create table debt_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  debt_id uuid not null references debts (id) on delete cascade,
  amount numeric not null,
  paid_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table debts enable row level security;
alter table debt_payments enable row level security;

create policy "accounts: owner full access" on accounts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "categories: owner full access" on categories
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "transactions: owner full access" on transactions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "budgets: owner full access" on budgets
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "debts: owner full access" on debts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "debt_payments: owner full access" on debt_payments
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
