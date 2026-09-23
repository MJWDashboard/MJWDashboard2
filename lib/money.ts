import type { Tables } from "@/lib/supabase/database.types";

type Account = Tables<"accounts">;
type Transaction = Tables<"transactions">;
type Debt = Tables<"debts">;
type SavingsGoal = Tables<"savings_goals">;
type RecurringExpense = Tables<"recurring_expenses">;

const LIABILITY_KINDS = ["credit_card", "loan", "store_account", "tax_liability", "other_liability"];

export function accountBalance(account: Account, transactions: Transaction[]) {
  const sum = transactions
    .filter((t) => t.account_id === account.id)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  return Number(account.opening_balance) + sum;
}

/** Ledgera rule: available cash excludes every credit facility, always. */
export function availableCash(accounts: Account[], transactions: Transaction[]) {
  return accounts
    .filter((a) => a.is_cash)
    .reduce((sum, a) => sum + accountBalance(a, transactions), 0);
}

export function totalDebtCapacity(accounts: Account[], transactions: Transaction[]) {
  return accounts
    .filter((a) => !a.is_cash)
    .reduce((sum, a) => sum + accountBalance(a, transactions), 0);
}

export function currentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthToDateSpend(transactions: Transaction[], categoryId: string, month: string) {
  return transactions
    .filter((t) => t.category_id === categoryId && t.occurred_at.startsWith(month) && Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
}

export function totalMonthToDateExpenses(transactions: Transaction[], month: string) {
  return transactions
    .filter((t) => t.occurred_at.startsWith(month) && Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
}

export function totalMonthToDateIncome(transactions: Transaction[], month: string) {
  return transactions
    .filter((t) => t.occurred_at.startsWith(month) && Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

export function todaysSpend(transactions: Transaction[], todayISO: string) {
  return transactions
    .filter((t) => t.occurred_at === todayISO && Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
}

export function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(amount);
}

/** Net Worth = Assets − Liabilities. Assets: cash/savings/investment
 * account balances plus savings goal progress. Liabilities: active debts
 * plus credit/loan/store/tax/other-liability account balances. Deliberately
 * simple — no property/vehicle valuations yet (Phase 4 doesn't give those
 * modules a value field either). */
export function calculateNetWorth(
  accounts: Account[],
  transactions: Transaction[],
  debts: Debt[],
  savingsGoals: SavingsGoal[]
) {
  const assetAccounts = accounts.filter((a) => a.active !== false && !LIABILITY_KINDS.includes(a.kind));
  const liabilityAccounts = accounts.filter((a) => a.active !== false && LIABILITY_KINDS.includes(a.kind));

  const totalAssets =
    assetAccounts.reduce((sum, a) => sum + accountBalance(a, transactions), 0) +
    savingsGoals.reduce((sum, g) => sum + Number(g.current_amount), 0);

  const totalLiabilities =
    liabilityAccounts.reduce((sum, a) => sum + Math.abs(accountBalance(a, transactions)), 0) +
    debts.filter((d) => d.status === "active").reduce((sum, d) => sum + Number(d.balance), 0);

  return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
}

const FREQUENCY_PER_YEAR: Record<string, number> = { weekly: 52, monthly: 12, quarterly: 4, annual: 1 };

export function recurringMonthlyCost(expenses: RecurringExpense[]) {
  return expenses
    .filter((e) => e.active)
    .reduce((sum, e) => sum + (Number(e.amount) * (FREQUENCY_PER_YEAR[e.frequency] ?? 12)) / 12, 0);
}

export function recurringAnnualCost(expenses: RecurringExpense[]) {
  return recurringMonthlyCost(expenses) * 12;
}

export function requiredMonthlyContribution(goal: SavingsGoal) {
  if (!goal.target_date) return null;
  const months = Math.max(
    1,
    Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
  );
  return Math.max(0, (Number(goal.target_amount) - Number(goal.current_amount)) / months);
}
