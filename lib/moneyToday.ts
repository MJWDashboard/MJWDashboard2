import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";
import { availableCash, currentMonth, totalMonthToDateExpenses, todaysSpend } from "@/lib/money";

export type MoneyToday = {
  availableCash: number;
  monthToDateExpenses: number;
  expensesToday: number;
  upcomingBillsCount: number;
  upcomingBillsTotal: number;
  debtDueSoon: { creditor: string; amount: number; dueInDays: number } | null;
};

export async function getMoneyToday(): Promise<MoneyToday> {
  const supabase = await createClient();
  const today = toZonedTime(new Date(), SAST);
  const todayISO = today.toISOString().slice(0, 10);
  const month = currentMonth(today);

  const [{ data: accounts }, { data: transactions }, { data: debts }] = await Promise.all([
    supabase.from("accounts").select("*"),
    supabase.from("transactions").select("*"),
    supabase.from("debts").select("id, creditor, minimum_payment, balance, due_day, status").eq("status", "active"),
  ]);

  const txns = transactions ?? [];
  const debtRows = debts ?? [];

  let debtDueSoon: MoneyToday["debtDueSoon"] = null;
  let upcomingBillsCount = 0;
  let upcomingBillsTotal = 0;

  for (const d of debtRows) {
    if (!d.due_day) continue;
    let candidate = new Date(today.getFullYear(), today.getMonth(), d.due_day);
    if (candidate < today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, d.due_day);
    const days = Math.round((candidate.getTime() - today.getTime()) / 86400000);
    const amount = d.minimum_payment ?? d.balance;
    if (days >= 0 && days <= 30) {
      upcomingBillsCount += 1;
      upcomingBillsTotal += Number(amount ?? 0);
    }
    if (days >= 0 && days <= 7 && (!debtDueSoon || days < debtDueSoon.dueInDays)) {
      debtDueSoon = { creditor: d.creditor, amount: Number(amount ?? 0), dueInDays: days };
    }
  }

  return {
    availableCash: availableCash(accounts ?? [], txns),
    monthToDateExpenses: totalMonthToDateExpenses(txns, month),
    expensesToday: todaysSpend(txns, todayISO),
    upcomingBillsCount,
    upcomingBillsTotal,
    debtDueSoon,
  };
}
