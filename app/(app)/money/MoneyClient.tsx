"use client";

import { useMemo, useState, useTransition } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, X, Wallet, Landmark, CreditCard, Upload } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import { accountBalance, availableCash, totalDebtCapacity, currentMonth, monthToDateSpend, formatZAR } from "@/lib/money";
import {
  createAccount,
  deleteAccount,
  createCategory,
  createTransaction,
  deleteTransaction,
  bulkImportTransactions,
  upsertBudget,
  createDebt,
  deleteDebt,
  addDebtPayment,
} from "./actions";

type Account = Tables<"accounts">;
type Transaction = Tables<"transactions">;
type Category = Tables<"categories">;
type Budget = Tables<"budgets">;
type Debt = Tables<"debts">;
type DebtPayment = Tables<"debt_payments">;
type Entity = Tables<"entities">;

const ACCOUNT_KINDS = ["cheque", "savings", "credit_card", "business", "loan", "store_account"] as const;
const TABS = ["Overview", "Accounts", "Transactions", "Debt"] as const;

export function MoneyClient({
  accounts,
  transactions,
  categories,
  budgets,
  debts,
  debtPayments,
  entities,
}: {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  entities: Entity[];
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
        title="Budget & Debt"
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
        <OverviewTab transactions={transactions} categories={categories} budgets={budgets} />
      )}
      {tab === "Accounts" && (
        <AccountsTab accounts={accounts} transactions={transactions} entities={entities} />
      )}
      {tab === "Transactions" && (
        <TransactionsTab accounts={accounts} categories={categories} transactions={transactions} />
      )}
      {tab === "Debt" && <DebtTab debts={debts} debtPayments={debtPayments} />}
    </div>
  );
}

function OverviewTab({
  transactions,
  categories,
  budgets,
}: {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}) {
  const month = currentMonth();
  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const monthBudgets = budgets.filter((b) => b.month === month);

  if (expenseCategories.length === 0) {
    return (
      <EmptyState icon={Wallet} title="No categories yet" detail="Add a transaction to create your first category, then set a monthly budget for it." />
    );
  }

  return (
    <div className="space-y-2">
      {expenseCategories.map((cat) => {
        const budget = monthBudgets.find((b) => b.category_id === cat.id);
        const spent = monthToDateSpend(transactions, cat.id, month);
        const planned = budget ? Number(budget.planned_amount) : 0;
        const pct = planned > 0 ? Math.min(100, (spent / planned) * 100) : 0;
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
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={clsx(
                    "h-full rounded-full",
                    severity === "overdue" ? "bg-overdue" : severity === "soon" ? "bg-soon" : "bg-ok"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : (
              <BudgetInput categoryId={cat.id} month={month} />
            )}
          </div>
        );
      })}
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
              <div key={acc.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">{acc.name}</p>
                  <p className="text-xs text-muted">
                    {acc.kind.replace("_", " ")} · {acc.is_cash ? "Cash" : "Credit facility"}
                    {entity && ` · ${entity.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span data-sensitive className="tabular text-sm text-text">
                    {formatZAR(accountBalance(acc, transactions))}
                  </span>
                  <button onClick={() => startTransition(() => deleteAccount(acc.id))} className="text-muted hover:text-overdue">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <AccountForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function AccountForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<(typeof ACCOUNT_KINDS)[number]>("cheque");
  const [isCash, setIsCash] = useState(true);
  const [opening, setOpening] = useState("0");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) return;
    startTransition(async () => {
      await createAccount({ name: name.trim(), kind, is_cash: isCash, opening_balance: Number(opening) });
      onClose();
    });
  }

  return (
    <FormSheet title="New account" onClose={onClose}>
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
          setIsCash(k !== "credit_card" && k !== "loan" && k !== "store_account");
        }}
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text"
      >
        {ACCOUNT_KINDS.map((k) => (
          <option key={k} value={k}>
            {k.replace("_", " ")}
          </option>
        ))}
      </select>
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
      <button onClick={save} disabled={pending} className="btn-primary w-full">
        Save account
      </button>
    </FormSheet>
  );
}

function TransactionsTab({
  accounts,
  categories,
  transactions,
}: {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [, startTransition] = useTransition();

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

      {accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="Add an account first" detail="Transactions belong to an account." />
      ) : transactions.length === 0 ? (
        <EmptyState icon={Wallet} title="No transactions yet" detail="Add one manually or import a CSV statement export." />
      ) : (
        <div className="space-y-2">
          {transactions.slice(0, 50).map((t) => {
            const cat = categories.find((c) => c.id === t.category_id);
            return (
              <div key={t.id} className="card flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm text-text">{t.description || cat?.name || "Transaction"}</p>
                  <p className="text-xs text-muted">
                    {new Date(t.occurred_at).toLocaleDateString("en-ZA")} {cat && `· ${cat.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span data-sensitive className={clsx("tabular text-sm", Number(t.amount) < 0 ? "text-text" : "text-ok")}>
                    {formatZAR(Number(t.amount))}
                  </span>
                  <button onClick={() => startTransition(() => deleteTransaction(t.id))} className="text-muted hover:text-overdue">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <TransactionForm accounts={accounts} categories={categories} onClose={() => setShowForm(false)} />}
      {showImport && <ImportForm accounts={accounts} onClose={() => setShowImport(false)} />}
    </div>
  );
}

function TransactionForm({
  accounts,
  categories,
  onClose,
}: {
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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
      await createTransaction({
        account_id: accountId,
        category_id: catId,
        description: description.trim(),
        amount: signedAmount,
        occurred_at: date,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New transaction" onClose={onClose}>
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
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        <option value="">New category...</option>
        {categories.filter((c) => c.kind === type).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      {!categoryId && (
        <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      )}
      <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save transaction</button>
    </FormSheet>
  );
}

function ImportForm({ accounts, onClose }: { accounts: Account[]; onClose: () => void }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleFile(file: File) {
    file.text().then(setText);
  }

  function parseAndImport() {
    const rows = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(1) // skip header
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const [date, description, amount] = cols;
        return { occurred_at: date, description: description ?? "", amount: Number(amount) };
      })
      .filter((r) => r.occurred_at && !Number.isNaN(r.amount));

    startTransition(async () => {
      const res = await bulkImportTransactions(accountId, rows);
      setResult(res.error ? res.error : `Imported ${res.count} transactions`);
      if (!res.error) setTimeout(onClose, 800);
    });
  }

  return (
    <FormSheet title="Import CSV" onClose={onClose}>
      <p className="text-xs text-muted">
        Columns: date, description, amount (negative for expenses). Export this from your bank statement.
      </p>
      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="w-full text-sm text-muted" />
      {result && <p className="text-xs text-text">{result}</p>}
      <button onClick={parseAndImport} disabled={pending || !text} className="btn-primary w-full">
        Import
      </button>
    </FormSheet>
  );
}

function DebtTab({ debts, debtPayments }: { debts: Debt[]; debtPayments: DebtPayment[] }) {
  const [showForm, setShowForm] = useState(false);
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
                  <button onClick={() => startTransition(() => deleteDebt(debt.id))} className="text-muted hover:text-overdue">
                    <Trash2 size={14} />
                  </button>
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

function DebtForm({ onClose }: { onClose: () => void }) {
  const [creditor, setCreditor] = useState("");
  const [kind, setKind] = useState("credit_card");
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [limit, setLimit] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!creditor.trim() || !balance) return;
    startTransition(async () => {
      await createDebt({
        creditor: creditor.trim(),
        kind,
        balance: Number(balance),
        interest_rate: rate ? Number(rate) : null,
        minimum_payment: minPayment ? Number(minPayment) : null,
        due_day: dueDay ? Number(dueDay) : null,
        limit_amount: limit ? Number(limit) : null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New debt" onClose={onClose}>
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
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save debt</button>
    </FormSheet>
  );
}

function ordinalSuffix(n: number) {
  if (n % 10 === 1 && n !== 11) return "st";
  if (n % 10 === 2 && n !== 12) return "nd";
  if (n % 10 === 3 && n !== 13) return "rd";
  return "th";
}

function FormSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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
