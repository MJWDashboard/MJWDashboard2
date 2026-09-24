"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, Pencil, X, Wallet, Landmark, CreditCard, Upload, TrendingUp, AlertCircle } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import {
  accountBalance,
  availableCash,
  totalDebtCapacity,
  monthToDateSpend,
  totalMonthToDateExpenses,
  totalMonthToDateIncome,
  recurringMonthlyCost,
  calculateNetWorth,
  formatZAR,
} from "@/lib/money";
import {
  createAccount,
  updateAccount,
  deleteAccount,
  createCategory,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  reviewTransaction,
  upsertBudget,
  createDebt,
  updateDebt,
  deleteDebt,
  addDebtPayment,
} from "./actions";
import { CategoriesTab } from "./CategoriesTab";
import { RecurringTab } from "./RecurringTab";
import { SavingsTab } from "./SavingsTab";
import { NetWorthTab } from "./NetWorthTab";
import { PayoffSimulator } from "./PayoffSimulator";
import { ImportFormV2 } from "./ImportFormV2";

type Account = Tables<"accounts">;
type Transaction = Tables<"transactions">;
type Category = Tables<"categories">;
type Budget = Tables<"budgets">;
type Debt = Tables<"debts">;
type DebtPayment = Tables<"debt_payments">;
type Entity = Tables<"entities">;
type RecurringExpense = Tables<"recurring_expenses">;
type SavingsGoal = Tables<"savings_goals">;
type NetWorthSnapshot = Tables<"net_worth_snapshots">;
type ImportTemplate = Tables<"import_templates">;

const ACCOUNT_KINDS = [
  "cheque", "savings", "cash", "investment", "credit_card", "loan", "store_account", "tax_liability", "other_asset", "other_liability", "business",
] as const;
const TABS = ["Overview", "Accounts", "Transactions", "Categories", "Recurring", "Debt", "Savings", "Net Worth"] as const;

export function MoneyClient({
  accounts,
  transactions,
  categories,
  budgets,
  debts,
  debtPayments,
  entities,
  recurringExpenses,
  savingsGoals,
  netWorthSnapshots,
  importTemplates,
  month,
}: {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  entities: Entity[];
  recurringExpenses: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  netWorthSnapshots: NetWorthSnapshot[];
  importTemplates: ImportTemplate[];
  month: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const cash = availableCash(accounts, transactions);
  const debtCapacity = totalDebtCapacity(accounts, transactions);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Wallet}
        color={NAV_ITEMS.find((n) => n.href === "/money")!.color}
        eyebrow="Money"
        title="Financial Core"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-muted">Available cash</p>
          <p data-sensitive className="tabular mt-1 text-xl font-semibold text-text">{formatZAR(cash)}</p>
          <p className="mt-1 text-xs text-muted">Cash accounts only</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Credit capacity used</p>
          <p data-sensitive className="tabular mt-1 text-xl font-semibold text-overdue">{formatZAR(debtCapacity)}</p>
          <p className="mt-1 text-xs text-muted">Debt, not cash</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              tab === t ? "bg-accent text-white" : "border border-border text-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <OverviewTab
          accounts={accounts}
          transactions={transactions}
          categories={categories}
          budgets={budgets}
          debts={debts}
          recurringExpenses={recurringExpenses}
          savingsGoals={savingsGoals}
          month={month}
        />
      )}
      {tab === "Accounts" && (
        <AccountsTab accounts={accounts} transactions={transactions} entities={entities} />
      )}
      {tab === "Transactions" && (
        <TransactionsTab accounts={accounts} categories={categories} transactions={transactions} importTemplates={importTemplates} />
      )}
      {tab === "Categories" && <CategoriesTab categories={categories} />}
      {tab === "Recurring" && <RecurringTab expenses={recurringExpenses} categories={categories} />}
      {tab === "Debt" && <DebtTab debts={debts} debtPayments={debtPayments} />}
      {tab === "Savings" && <SavingsTab goals={savingsGoals} accounts={accounts} />}
      {tab === "Net Worth" && (
        <NetWorthTab
          accounts={accounts}
          transactions={transactions}
          debts={debts}
          savingsGoals={savingsGoals}
          snapshots={netWorthSnapshots}
          month={month}
        />
      )}
    </div>
  );
}

function OverviewTab({
  accounts,
  transactions,
  categories,
  budgets,
  debts,
  recurringExpenses,
  savingsGoals,
  month,
}: {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  debts: Debt[];
  recurringExpenses: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  month: string;
}) {
  const income = totalMonthToDateIncome(transactions, month);
  const expenses = totalMonthToDateExpenses(transactions, month);
  const cashFlow = income - expenses;
  const totalPlanned = budgets.reduce((sum, b) => sum + Number(b.planned_amount), 0);
  const remainingBudget = Math.max(0, totalPlanned - expenses);
  const totalDebt = debts.filter((d) => d.status === "active").reduce((sum, d) => sum + Number(d.balance), 0);
  const totalSavings = savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const { netWorth } = calculateNetWorth(accounts, transactions, debts, savingsGoals);
  const monthlyRecurring = recurringMonthlyCost(recurringExpenses);

  const upcomingBills = recurringExpenses.filter((e) => {
    if (!e.active || !e.next_due_date) return false;
    const days = (new Date(e.next_due_date).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 30;
  });

  const expenseCategories = categories.filter((c) => c.kind === "expense" && !c.hidden);
  const monthBudgets = budgets.filter((b) => b.month === month);

  // Simple analytics: top merchants and largest expenses this month.
  const monthTxns = transactions.filter((t) => t.occurred_at.startsWith(month) && Number(t.amount) < 0);
  const byMerchant = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxns) {
      const key = t.merchant || t.description || "Other";
      map.set(key, (map.get(key) ?? 0) + Math.abs(Number(t.amount)));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [monthTxns]);
  const largestExpenses = [...monthTxns].sort((a, b) => Number(a.amount) - Number(b.amount)).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard label="Income (MTD)" value={formatZAR(income)} tone="ok" />
        <MetricCard label="Expenses (MTD)" value={formatZAR(expenses)} tone="overdue" />
        <MetricCard label="Cash flow" value={formatZAR(cashFlow)} tone={cashFlow >= 0 ? "ok" : "overdue"} />
        <MetricCard label="Remaining budget" value={formatZAR(remainingBudget)} />
        <MetricCard label="Total debt" value={formatZAR(totalDebt)} tone="overdue" />
        <MetricCard label="Savings" value={formatZAR(totalSavings)} tone="ok" />
        <MetricCard label="Net worth" value={formatZAR(netWorth)} />
        <MetricCard label="Recurring / month" value={formatZAR(monthlyRecurring)} />
        <MetricCard label="Upcoming bills (30d)" value={String(upcomingBills.length)} />
      </div>

      <section>
        <p className="mb-2 text-sm font-medium text-text">Category budgets</p>
        {expenseCategories.length === 0 ? (
          <EmptyState icon={Wallet} title="No categories yet" detail="Add a transaction to create your first category, then set a monthly budget for it." />
        ) : (
          <div className="space-y-2">
            {expenseCategories.map((cat) => {
              const budget = monthBudgets.find((b) => b.category_id === cat.id);
              const spent = monthToDateSpend(transactions, cat.id, month);
              const planned = budget ? Number(budget.planned_amount) : 0;
              const pct = planned > 0 ? Math.min(100, (spent / planned) * 100) : 0;
              const projected = planned > 0 ? (spent / Math.max(1, new Date().getDate())) * 30 : 0;
              const severity = planned === 0 ? "ok" : pct >= 100 ? "overdue" : pct >= 90 ? "soon" : "ok";
              return (
                <div key={cat.id} className="card space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text">{cat.name}</span>
                    <span data-sensitive className="tabular text-muted">
                      {formatZAR(spent)} {planned > 0 && `/ ${formatZAR(planned)}`}
                    </span>
                  </div>
                  {planned > 0 ? (
                    <>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className={clsx("h-full rounded-full", severity === "overdue" ? "bg-overdue" : severity === "soon" ? "bg-soon" : "bg-ok")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {projected > planned && (
                        <p className="text-xs text-soon">Projected month-end: {formatZAR(projected)}</p>
                      )}
                    </>
                  ) : (
                    <BudgetInput categoryId={cat.id} month={month} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {(byMerchant.length > 0 || largestExpenses.length > 0) && (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="card space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-text">
              <TrendingUp size={14} /> Top spend this month
            </p>
            {byMerchant.map(([name, amount]) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="truncate text-muted">{name}</span>
                <span data-sensitive className="tabular text-text">{formatZAR(amount)}</span>
              </div>
            ))}
          </div>
          <div className="card space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-text">
              <AlertCircle size={14} /> Largest expenses
            </p>
            {largestExpenses.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <span className="truncate text-muted">{t.merchant || t.description || "Transaction"}</span>
                <span data-sensitive className="tabular text-text">{formatZAR(Math.abs(Number(t.amount)))}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: "ok" | "overdue" }) {
  return (
    <div className="card">
      <p className="text-xs text-muted">{label}</p>
      <p
        data-sensitive
        className={clsx("tabular mt-1 text-base font-semibold", tone === "ok" ? "text-ok" : tone === "overdue" ? "text-overdue" : "text-text")}
      >
        {value}
      </p>
    </div>
  );
}

function BudgetInput({ categoryId, month }: { categoryId: string; month: string }) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="number"
        placeholder="Set monthly budget"
        className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-text outline-none"
      />
      <button
        disabled={pending || !value}
        onClick={() => startTransition(async () => { await upsertBudget(categoryId, month, Number(value)); })}
        className="text-xs text-accent"
      >
        Set
      </button>
    </div>
  );
}

function AccountsTab({
  accounts,
  transactions,
  entities,
}: {
  accounts: Account[];
  transactions: Transaction[];
  entities: Entity[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add account
      </button>

      {accounts.length === 0 ? (
        <EmptyState icon={Landmark} title="No accounts yet" detail="Add your cheque, credit card and savings accounts to start tracking." />
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => {
            const entity = entities.find((e) => e.id === acc.entity_id);
            return (
              <div key={acc.id} className={clsx("card flex items-center justify-between", !acc.active && "opacity-50")}>
                <div>
                  <p className="text-sm font-medium text-text">{acc.name}</p>
                  <p className="text-xs text-muted">
                    {acc.kind.replace("_", " ")} · {acc.is_cash ? "Cash" : "Credit facility"}
                    {acc.institution && ` · ${acc.institution}`}
                    {entity && ` · ${entity.name}`}
                    {!acc.active && " · inactive"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span data-sensitive className="tabular text-sm text-text">
                    {formatZAR(accountBalance(acc, transactions))}
                  </span>
                  <button onClick={() => setEditing(acc)} className="text-muted hover:text-text" aria-label="Edit account">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => startTransition(() => deleteAccount(acc.id))} className="text-muted hover:text-overdue" aria-label="Delete account">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <AccountForm onClose={() => setShowForm(false)} />}
      {editing && <AccountForm account={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AccountForm({ account, onClose }: { account?: Account; onClose: () => void }) {
  const [name, setName] = useState(account?.name ?? "");
  const [kind, setKind] = useState<(typeof ACCOUNT_KINDS)[number]>((account?.kind as (typeof ACCOUNT_KINDS)[number]) ?? "cheque");
  const [isCash, setIsCash] = useState(account?.is_cash ?? true);
  const [opening, setOpening] = useState(account?.opening_balance?.toString() ?? "0");
  const [institution, setInstitution] = useState(account?.institution ?? "");
  const [creditLimit, setCreditLimit] = useState(account?.credit_limit?.toString() ?? "");
  const [interestRate, setInterestRate] = useState(account?.interest_rate?.toString() ?? "");
  const [minimumPayment, setMinimumPayment] = useState(account?.minimum_payment?.toString() ?? "");
  const [active, setActive] = useState(account?.active ?? true);
  const [pending, startTransition] = useTransition();

  const isCredit = kind === "credit_card" || kind === "loan" || kind === "store_account" || kind === "other_liability" || kind === "tax_liability";

  function save() {
    if (!name.trim()) return;
    const fields = {
      name: name.trim(),
      kind,
      is_cash: isCash,
      opening_balance: Number(opening),
      institution: institution.trim() || null,
      credit_limit: creditLimit ? Number(creditLimit) : null,
      interest_rate: interestRate ? Number(interestRate) : null,
      minimum_payment: minimumPayment ? Number(minimumPayment) : null,
      active,
    };
    startTransition(async () => {
      if (account) await updateAccount(account.id, fields);
      else await createAccount(fields);
      onClose();
    });
  }

  return (
    <FormSheet title={account ? "Edit account" : "New account"} onClose={onClose}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. ABSA Cheque"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      <select
        value={kind}
        onChange={(e) => {
          const k = e.target.value as (typeof ACCOUNT_KINDS)[number];
          setKind(k);
          setIsCash(!["credit_card", "loan", "store_account", "other_liability", "tax_liability"].includes(k));
        }}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text"
      >
        {ACCOUNT_KINDS.map((k) => (
          <option key={k} value={k}>
            {k.replace("_", " ")}
          </option>
        ))}
      </select>
      <input
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
        placeholder="Institution (optional)"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={isCash} onChange={(e) => setIsCash(e.target.checked)} />
        Counts as cash (excluded if it's a credit facility)
      </label>
      <input
        value={opening}
        onChange={(e) => setOpening(e.target.value)}
        type="number"
        placeholder="Opening balance"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      {isCredit && (
        <div className="grid grid-cols-3 gap-2">
          <input value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} type="number" placeholder="Limit" className="rounded-xl border border-border bg-background px-2 py-2.5 text-sm text-text outline-none focus:border-accent" />
          <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} type="number" placeholder="Rate %" className="rounded-xl border border-border bg-background px-2 py-2.5 text-sm text-text outline-none focus:border-accent" />
          <input value={minimumPayment} onChange={(e) => setMinimumPayment(e.target.value)} type="number" placeholder="Min pay" className="rounded-xl border border-border bg-background px-2 py-2.5 text-sm text-text outline-none focus:border-accent" />
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      <button onClick={save} disabled={pending} className="btn-primary w-full">
        {account ? "Save changes" : "Save account"}
      </button>
    </FormSheet>
  );
}

function TransactionsTab({
  accounts,
  categories,
  transactions,
  importTemplates,
}: {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  importTemplates: ImportTemplate[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [, startTransition] = useTransition();

  const needsReview = transactions.filter((t) => !t.reviewed);
  const reviewed = transactions.filter((t) => t.reviewed);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => setShowForm(true)} className="btn-secondary flex-1" disabled={accounts.length === 0}>
          <Plus size={14} /> Add
        </button>
        <button onClick={() => setShowImport(true)} className="btn-secondary flex-1" disabled={accounts.length === 0}>
          <Upload size={14} /> Import CSV
        </button>
      </div>

      {needsReview.length > 0 && (
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-soon">
            <AlertCircle size={14} /> Needs review ({needsReview.length})
          </p>
          <div className="space-y-2">
            {needsReview.map((t) => (
              <ReviewRow key={t.id} transaction={t} categories={categories} />
            ))}
          </div>
        </section>
      )}

      {accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="Add an account first" detail="Transactions belong to an account." />
      ) : reviewed.length === 0 ? (
        <EmptyState icon={Wallet} title="No transactions yet" detail="Add one manually or import a CSV statement export." />
      ) : (
        <div className="space-y-2">
          {reviewed.slice(0, 50).map((t) => {
            const cat = categories.find((c) => c.id === t.category_id);
            return (
              <div key={t.id} className="card flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm text-text">{t.merchant || t.description || cat?.name || "Transaction"}</p>
                  <p className="text-xs text-muted">
                    {new Date(t.occurred_at).toLocaleDateString("en-ZA")} {cat && `· ${cat.name}`} {t.recurring && "· recurring"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span data-sensitive className={clsx("tabular text-sm", Number(t.amount) < 0 ? "text-text" : "text-ok")}>
                    {formatZAR(Number(t.amount))}
                  </span>
                  <button onClick={() => setEditing(t)} className="text-muted hover:text-text" aria-label="Edit transaction">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => startTransition(() => deleteTransaction(t.id))} className="text-muted hover:text-overdue" aria-label="Delete transaction">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <TransactionForm accounts={accounts} categories={categories} onClose={() => setShowForm(false)} />}
      {editing && (
        <TransactionForm accounts={accounts} categories={categories} transaction={editing} onClose={() => setEditing(null)} />
      )}
      {showImport && (
        <ImportFormV2 accounts={accounts} templates={importTemplates} onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}

function ReviewRow({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="card space-y-2 border-soon/40 bg-soon/5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text">{transaction.merchant || transaction.description}</p>
        <span data-sensitive className="tabular text-sm text-text">{formatZAR(Number(transaction.amount))}</span>
      </div>
      <p className="text-xs text-muted">{new Date(transaction.occurred_at).toLocaleDateString("en-ZA")}</p>
      <div className="flex gap-2">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text">
          <option value="">No category</option>
          {categories.filter((c) => !c.hidden).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => startTransition(() => reviewTransaction(transaction.id, categoryId || null, transaction.merchant))}
          disabled={pending}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

function TransactionForm({
  accounts,
  categories,
  transaction,
  onClose,
}: {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction;
  onClose: () => void;
}) {
  const [accountId, setAccountId] = useState(transaction?.account_id ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string>(transaction?.category_id ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [merchant, setMerchant] = useState(transaction?.merchant ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [amount, setAmount] = useState(transaction ? Math.abs(Number(transaction.amount)).toString() : "");
  const [type, setType] = useState<"expense" | "income">(transaction && Number(transaction.amount) > 0 ? "income" : "expense");
  const [date, setDate] = useState(transaction?.occurred_at.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method ?? "");
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [recurring, setRecurring] = useState(transaction?.recurring ?? false);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!accountId || !amount) return;
    startTransition(async () => {
      let catId = categoryId || null;
      if (!catId && newCategory.trim()) {
        const { data } = await createCategory(newCategory.trim(), type);
        catId = data?.id ?? null;
      }
      const signedAmount = type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
      const fields = {
        account_id: accountId,
        category_id: catId,
        description: description.trim(),
        merchant: merchant.trim() || null,
        amount: signedAmount,
        occurred_at: date,
        payment_method: paymentMethod.trim() || null,
        notes: notes.trim() || null,
        recurring,
      };
      if (transaction) await updateTransaction(transaction.id, fields);
      else await createTransaction(fields);
      onClose();
    });
  }

  return (
    <FormSheet title={transaction ? "Edit transaction" : "New transaction"} onClose={onClose}>
      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as "expense" | "income")} className="w-28 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        <option value="">New category...</option>
        {categories.filter((c) => c.kind === type && !c.hidden).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {!categoryId && (
        <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      )}
      <div className="grid grid-cols-2 gap-2">
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Payment method" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        This is a recurring transaction
      </label>
      <button onClick={save} disabled={pending} className="btn-primary w-full">{transaction ? "Save changes" : "Save transaction"}</button>
    </FormSheet>
  );
}

function DebtTab({ debts, debtPayments }: { debts: Debt[]; debtPayments: DebtPayment[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const active = debts.filter((d) => d.status === "active");
  const totalDebt = active.reduce((sum, d) => sum + Number(d.balance), 0);
  const totalMin = active.reduce((sum, d) => sum + Number(d.minimum_payment ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-muted">Total debt</p>
          <p data-sensitive className="tabular mt-1 text-lg font-semibold text-overdue">{formatZAR(totalDebt)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Monthly minimums</p>
          <p data-sensitive className="tabular mt-1 text-lg font-semibold text-text">{formatZAR(totalMin)}</p>
        </div>
      </div>

      {active.length > 0 && <PayoffSimulator debts={active} />}

      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add debt
      </button>

      {active.length === 0 ? (
        <EmptyState icon={CreditCard} title="No debts tracked" detail="Add credit cards, store accounts or loans to plan payoff." />
      ) : (
        <div className="space-y-2">
          {active.map((debt) => {
            const utilisation = debt.limit_amount ? (Number(debt.balance) / Number(debt.limit_amount)) * 100 : null;
            return (
              <div key={debt.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text">{debt.creditor}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditing(debt)} className="text-muted hover:text-text" aria-label="Edit debt">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => startTransition(() => deleteDebt(debt.id))} className="text-muted hover:text-overdue" aria-label="Delete debt">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{debt.kind.replace("_", " ")}</span>
                  <span data-sensitive className="tabular text-text">{formatZAR(Number(debt.balance))}</span>
                </div>
                {utilisation !== null && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className={clsx("h-full rounded-full", utilisation >= 30 ? "bg-overdue" : "bg-ok")}
                      style={{ width: `${Math.min(100, utilisation)}%` }}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Min payment: {debt.minimum_payment ? formatZAR(Number(debt.minimum_payment)) : "—"}</span>
                  <span>{debt.due_day ? `Due on the ${debt.due_day}${ordinalSuffix(debt.due_day)}` : "No due date set"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => setHistoryId(historyId === debt.id ? null : debt.id)}
                    className="text-muted hover:text-text"
                  >
                    {debtPayments.filter((p) => p.debt_id === debt.id).length} payment
                    {debtPayments.filter((p) => p.debt_id === debt.id).length === 1 ? "" : "s"} logged
                  </button>
                  <button onClick={() => setPayingId(debt.id)} className="text-accent">Log payment</button>
                </div>
                {historyId === debt.id && (
                  <div className="space-y-1 border-t border-border pt-2">
                    {debtPayments.filter((p) => p.debt_id === debt.id).length === 0 ? (
                      <p className="text-xs text-muted">No payments logged yet.</p>
                    ) : (
                      debtPayments
                        .filter((p) => p.debt_id === debt.id)
                        .map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted">{new Date(p.paid_at).toLocaleDateString("en-ZA")}</span>
                            <span data-sensitive className="tabular text-text">{formatZAR(Number(p.amount))}</span>
                          </div>
                        ))
                    )}
                  </div>
                )}
                {payingId === debt.id && (
                  <PaymentInput debtId={debt.id} onDone={() => setPayingId(null)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <DebtForm onClose={() => setShowForm(false)} />}
      {editing && <DebtForm debt={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PaymentInput({ debtId, onDone }: { debtId: string; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2 border-t border-border pt-2">
      <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount paid" className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-text outline-none" />
      <button
        disabled={pending || !amount}
        onClick={() => startTransition(async () => {
          await addDebtPayment(debtId, Number(amount), new Date().toISOString().slice(0, 10));
          onDone();
        })}
        className="text-xs text-accent"
      >
        Log
      </button>
    </div>
  );
}

function DebtForm({ debt, onClose }: { debt?: Debt; onClose: () => void }) {
  const [creditor, setCreditor] = useState(debt?.creditor ?? "");
  const [kind, setKind] = useState(debt?.kind ?? "credit_card");
  const [balance, setBalance] = useState(debt?.balance?.toString() ?? "");
  const [rate, setRate] = useState(debt?.interest_rate?.toString() ?? "");
  const [minPayment, setMinPayment] = useState(debt?.minimum_payment?.toString() ?? "");
  const [dueDay, setDueDay] = useState(debt?.due_day?.toString() ?? "");
  const [limit, setLimit] = useState(debt?.limit_amount?.toString() ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!creditor.trim() || !balance) return;
    startTransition(async () => {
      const fields = {
        creditor: creditor.trim(),
        kind,
        balance: Number(balance),
        interest_rate: rate ? Number(rate) : null,
        minimum_payment: minPayment ? Number(minPayment) : null,
        due_day: dueDay ? Number(dueDay) : null,
        limit_amount: limit ? Number(limit) : null,
      };
      if (debt) {
        await updateDebt(debt.id, fields);
      } else {
        await createDebt(fields);
      }
      onClose();
    });
  }

  return (
    <FormSheet title={debt ? "Edit debt" : "New debt"} onClose={onClose}>
      <input value={creditor} onChange={(e) => setCreditor(e.target.value)} placeholder="Creditor" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        <option value="credit_card">Credit card</option>
        <option value="store_account">Store account</option>
        <option value="personal_loan">Personal loan</option>
        <option value="vehicle_finance">Vehicle finance</option>
        <option value="other">Other</option>
      </select>
      <input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" placeholder="Current balance" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" placeholder="Interest %" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={minPayment} onChange={(e) => setMinPayment(e.target.value)} type="number" placeholder="Min payment" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <div className="flex gap-2">
        <input
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          type="number"
          min={1}
          max={31}
          placeholder="Due day of month (e.g. 25)"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
        <input value={limit} onChange={(e) => setLimit(e.target.value)} type="number" placeholder="Credit limit" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <button onClick={save} disabled={pending} className="btn-primary w-full">{debt ? "Save changes" : "Save debt"}</button>
    </FormSheet>
  );
}

function ordinalSuffix(n: number) {
  if (n % 10 === 1 && n !== 11) return "st";
  if (n % 10 === 2 && n !== 12) return "nd";
  if (n % 10 === 3 && n !== 13) return "rd";
  return "th";
}

export function FormSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{title}</p>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
