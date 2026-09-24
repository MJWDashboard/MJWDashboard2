import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";
import { formatZAR, currentMonth, recurringMonthlyCost } from "@/lib/money";
import { simulatePayoff, type PayoffDebt } from "@/lib/debtPayoff";
import { currentStreak, bestStreak, completionRate, type Habit, type HabitLog } from "@/lib/habits";
import { costPerKm } from "@/lib/vehicle";

export type InsightTone = "positive" | "neutral" | "warning";

export type Insight = {
  id: string;
  category: "Money" | "Time" | "Habits" | "Vehicle" | "Goals";
  tone: InsightTone;
  text: string;
  href: string;
};

function previousMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Short, factual, actionable observations across money, time, habits and
 * vehicle costs — computed live from existing data, the same approach as
 * lib/watchlist.ts, rather than stored/precomputed and liable to go stale.
 * Deliberately avoids generic motivational copy: every line here names a
 * number pulled straight from the owner's own records. */
export async function getInsights(): Promise<Insight[]> {
  const supabase = await createClient();
  const today = toZonedTime(new Date(), SAST);
  const month = currentMonth(today);
  const lastMonth = previousMonth(month);
  const insights: Insight[] = [];

  const [
    { data: transactions },
    { data: categories },
    { data: budgets },
    { data: debts },
    { data: netWorthSnapshots },
    { data: tasks },
    { data: habits },
    { data: habitLogs },
    { data: fuelLogs },
    { data: goals },
    { data: accounts },
    { data: recurringExpenses },
    { data: allBalanceTx },
  ] = await Promise.all([
    supabase.from("transactions").select("id, amount, occurred_at, category_id, merchant, account_id").gte("occurred_at", `${lastMonth}-01`),
    supabase.from("categories").select("id, name").eq("hidden", false),
    supabase.from("budgets").select("category_id, month, planned_amount").eq("month", month),
    supabase.from("debts").select("id, creditor, balance, interest_rate, minimum_payment").eq("status", "active"),
    supabase.from("net_worth_snapshots").select("snapshot_month, net_worth").order("snapshot_month", { ascending: false }).limit(2),
    supabase.from("tasks").select("id, status, due_date"),
    supabase.from("habits").select("*").eq("active", true),
    supabase.from("habit_logs").select("*"),
    supabase.from("fuel_logs").select("*").order("occurred_at", { ascending: true }),
    supabase.from("goals").select("id, title, next_action, deadline").in("status", ["active", "planned"]),
    supabase.from("accounts").select("id, is_cash, opening_balance"),
    supabase.from("recurring_expenses").select("provider, amount, frequency, active"),
    supabase.from("transactions").select("account_id, amount"),
  ]);

  // --- Money ------------------------------------------------------------
  const thisMonthTx = (transactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === month);
  const lastMonthTx = (transactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === lastMonth);
  const thisMonthSpend = thisMonthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const lastMonthSpend = lastMonthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  if (lastMonthSpend > 0) {
    const dayOfMonth = today.getDate();
    const lastMonthSameDaySpend = lastMonthTx
      .filter((t) => t.amount < 0 && Number(t.occurred_at.slice(8, 10)) <= dayOfMonth)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    if (lastMonthSameDaySpend > 0) {
      const delta = ((thisMonthSpend - lastMonthSameDaySpend) / lastMonthSameDaySpend) * 100;
      insights.push({
        id: "money-pace",
        category: "Money",
        tone: delta > 15 ? "warning" : delta < -10 ? "positive" : "neutral",
        text: `You've spent ${formatZAR(thisMonthSpend)} this month so far, ${delta >= 0 ? `${Math.round(delta)}% more` : `${Math.round(-delta)}% less`} than the same point last month (${formatZAR(lastMonthSameDaySpend)}).`,
        href: "/money",
      });
    }
  }

  const categoryNames = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const spendByCategory = new Map<string, number>();
  for (const t of thisMonthTx) {
    if (t.amount >= 0 || !t.category_id) continue;
    spendByCategory.set(t.category_id, (spendByCategory.get(t.category_id) ?? 0) + Math.abs(t.amount));
  }
  for (const b of budgets ?? []) {
    const spent = spendByCategory.get(b.category_id) ?? 0;
    if (spent > Number(b.planned_amount)) {
      insights.push({
        id: `budget-over-${b.category_id}`,
        category: "Money",
        tone: "warning",
        text: `${categoryNames.get(b.category_id) ?? "A category"} is over budget this month: ${formatZAR(spent)} spent against a ${formatZAR(Number(b.planned_amount))} plan.`,
        href: "/money",
      });
    }
  }

  const merchantSpend = new Map<string, number>();
  for (const t of thisMonthTx) {
    if (t.amount >= 0 || !t.merchant) continue;
    merchantSpend.set(t.merchant, (merchantSpend.get(t.merchant) ?? 0) + Math.abs(t.amount));
  }
  const topMerchant = [...merchantSpend.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topMerchant) {
    insights.push({
      id: "money-top-merchant",
      category: "Money",
      tone: "neutral",
      text: `Your top merchant this month is ${topMerchant[0]} — ${formatZAR(topMerchant[1])} so far.`,
      href: "/money",
    });
  }

  if (netWorthSnapshots && netWorthSnapshots.length === 2) {
    const [latest, prior] = netWorthSnapshots;
    const change = Number(latest.net_worth) - Number(prior.net_worth);
    insights.push({
      id: "net-worth-change",
      category: "Money",
      tone: change >= 0 ? "positive" : "warning",
      text: `Net worth ${change >= 0 ? "grew" : "fell"} by ${formatZAR(Math.abs(change))} since ${prior.snapshot_month} — now ${formatZAR(Number(latest.net_worth))}.`,
      href: "/money",
    });
  }

  if (debts && debts.length > 0) {
    const payoffDebts: PayoffDebt[] = debts.map((d) => ({
      id: d.id,
      creditor: d.creditor,
      balance: Number(d.balance),
      interestRate: d.interest_rate != null ? Number(d.interest_rate) : null,
      minimumPayment: d.minimum_payment != null ? Number(d.minimum_payment) : null,
    }));
    const result = simulatePayoff(payoffDebts, "avalanche", 0);
    if (result.feasible) {
      insights.push({
        id: "debt-payoff-pace",
        category: "Money",
        tone: "neutral",
        text: `At minimum payments only, your ${debts.length} active debt${debts.length === 1 ? "" : "s"} will be paid off in ${result.months} month${result.months === 1 ? "" : "s"} (${formatZAR(result.totalInterest)} interest).`,
        href: "/money",
      });
    } else {
      insights.push({
        id: "debt-payoff-infeasible",
        category: "Money",
        tone: "warning",
        text: `Minimum payments alone won't clear your active debt within 50 years — at least one minimum payment doesn't cover its interest.`,
        href: "/money",
      });
    }
  }

  // Projected month-end spend vs total planned budget — a pace warning, not
  // just a point-in-time comparison, so it fires before the month is over.
  const totalBudget = (budgets ?? []).reduce((s, b) => s + Number(b.planned_amount), 0);
  if (totalBudget > 0) {
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const projectedSpend = (thisMonthSpend / dayOfMonth) * daysInMonth;
    if (projectedSpend > totalBudget * 1.05) {
      insights.push({
        id: "budget-pace-projection",
        category: "Money",
        tone: "warning",
        text: `At this month's pace you're on track to spend ${formatZAR(projectedSpend)} against a ${formatZAR(totalBudget)} plan — ${formatZAR(projectedSpend - totalBudget)} over.`,
        href: "/money",
      });
    }
  }

  // Cash flow runway: available cash against upcoming committed costs
  // (recurring bills + active debt minimums) — a genuine near-term warning,
  // not just a spend-rate number.
  if (accounts && allBalanceTx) {
    const cash = accounts
      .filter((a) => a.is_cash)
      .reduce((sum, a) => {
        const balance = allBalanceTx.filter((t) => t.account_id === a.id).reduce((s, t) => s + Number(t.amount), 0);
        return sum + Number(a.opening_balance) + balance;
      }, 0);
    const monthlyCommitted =
      recurringMonthlyCost((recurringExpenses ?? []) as Parameters<typeof recurringMonthlyCost>[0]) +
      (debts ?? []).reduce((s, d) => s + (d.minimum_payment ?? 0), 0);
    if (monthlyCommitted > 0) {
      const runwayMonths = cash / monthlyCommitted;
      if (runwayMonths < 1) {
        insights.push({
          id: "cash-runway",
          category: "Money",
          tone: "warning",
          text: `Available cash (${formatZAR(cash)}) covers less than a month of committed bills and debt minimums (${formatZAR(monthlyCommitted)}/month).`,
          href: "/money",
        });
      }
    }
  }

  // --- Time ---------------------------------------------------------------
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const dueThisWeek = (tasks ?? []).filter((t) => t.due_date && t.due_date >= weekAgoStr && t.due_date <= todayStr);
  if (dueThisWeek.length > 0) {
    const completed = dueThisWeek.filter((t) => t.status === "complete").length;
    const rate = Math.round((completed / dueThisWeek.length) * 100);
    insights.push({
      id: "task-completion-week",
      category: "Time",
      tone: rate >= 70 ? "positive" : rate < 40 ? "warning" : "neutral",
      text: `You completed ${completed} of ${dueThisWeek.length} tasks due in the last 7 days (${rate}%).`,
      href: "/plan",
    });
  }

  const carriedOver = (tasks ?? []).filter(
    (t) => t.due_date && t.due_date < todayStr && t.status !== "complete" && t.status !== "cancelled"
  ).length;
  if (carriedOver > 0) {
    insights.push({
      id: "tasks-carried-over",
      category: "Time",
      tone: carriedOver >= 5 ? "warning" : "neutral",
      text: `${carriedOver} task${carriedOver === 1 ? " is" : "s are"} overdue and carrying forward.`,
      href: "/plan",
    });
  }

  // --- Habits ---------------------------------------------------------------
  const habitList = (habits ?? []) as Habit[];
  const logsByHabit = new Map<string, HabitLog[]>();
  for (const log of (habitLogs ?? []) as HabitLog[]) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }
  if (habitList.length > 0) {
    let bestHabit: { habit: Habit; streak: number } | null = null;
    let totalRate = 0;
    for (const habit of habitList) {
      const logs = logsByHabit.get(habit.id) ?? [];
      const streak = currentStreak(habit, logs);
      if (!bestHabit || streak > bestHabit.streak) bestHabit = { habit, streak };
      totalRate += completionRate(habit, logs, 30);
    }
    const avgRate = Math.round(totalRate / habitList.length);
    insights.push({
      id: "habits-completion-30d",
      category: "Habits",
      tone: avgRate >= 70 ? "positive" : avgRate < 40 ? "warning" : "neutral",
      text: `Across ${habitList.length} active habit${habitList.length === 1 ? "" : "s"}, your average completion rate over the last 30 days is ${avgRate}%.`,
      href: "/health",
    });
    if (bestHabit && bestHabit.streak >= 3) {
      insights.push({
        id: "habits-best-streak",
        category: "Habits",
        tone: "positive",
        text: `Your longest current streak is ${bestHabit.streak} day${bestHabit.streak === 1 ? "" : "s"} — ${bestHabit.habit.name}.`,
        href: "/health",
      });
    }
    const bestEver = habitList.reduce((best, h) => Math.max(best, bestStreak(h, logsByHabit.get(h.id) ?? [])), 0);
    if (bestEver >= 14) {
      insights.push({
        id: "habits-best-ever",
        category: "Habits",
        tone: "positive",
        text: `Your best-ever habit streak on file is ${bestEver} days.`,
        href: "/health",
      });
    }
  }

  // --- Vehicle ---------------------------------------------------------------
  const fuel = fuelLogs ?? [];
  if (fuel.length > 0) {
    const result = costPerKm(fuel as Parameters<typeof costPerKm>[0]);
    if (result) {
      insights.push({
        id: "vehicle-cost-per-km",
        category: "Vehicle",
        tone: "neutral",
        text: `Your running cost per km is ${formatZAR(result.costPerKm)} (${result.litresPer100km.toFixed(1)} L/100km) over ${result.distance.toLocaleString("en-ZA")} km.`,
        href: "/vehicle",
      });
    }
  }

  // --- Goals ---------------------------------------------------------------
  for (const g of goals ?? []) {
    if (!g.next_action) {
      insights.push({
        id: `goal-no-next-action-${g.id}`,
        category: "Goals",
        tone: "warning",
        text: `"${g.title}" has no next action set — it's easy to lose momentum without one.`,
        href: "/goals",
      });
    }
  }

  return insights;
}
