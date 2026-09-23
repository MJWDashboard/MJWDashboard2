import type { Tables } from "@/lib/supabase/database.types";

type Account = Tables<"accounts">;
type Transaction = Tables<"transactions">;

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
