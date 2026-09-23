import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";
import { formatZAR, currentMonth } from "@/lib/money";
import { MonthlyReviewClient } from "./MonthlyReviewClient";

export const metadata = { title: "Monthly Review" };

export default async function MonthlyReviewPage() {
  const supabase = await createClient();
  const today = toZonedTime(new Date(), SAST);
  const month = currentMonth(today);
  const reviewMonth = `${month}-01`;

  const [{ data: transactions }, { data: netWorthSnapshots }, { data: goals }, { data: existing }] = await Promise.all([
    supabase.from("transactions").select("amount, occurred_at").gte("occurred_at", `${month}-01`),
    supabase.from("net_worth_snapshots").select("snapshot_month, net_worth").order("snapshot_month", { ascending: false }).limit(2),
    supabase.from("goals").select("id, status").in("status", ["active", "planned"]),
    supabase.from("monthly_reviews").select("*").eq("review_month", reviewMonth).maybeSingle(),
  ]);

  const tx = (transactions ?? []).filter((t) => t.occurred_at.slice(0, 7) === month);
  const expenses = tx.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const income = tx.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
  const netWorthChange =
    netWorthSnapshots && netWorthSnapshots.length === 2
      ? Number(netWorthSnapshots[0].net_worth) - Number(netWorthSnapshots[1].net_worth)
      : null;

  return (
    <MonthlyReviewClient
      reviewMonth={reviewMonth}
      stats={{
        income: formatZAR(income),
        expenses: formatZAR(expenses),
        netWorthChange: netWorthChange != null ? formatZAR(netWorthChange) : null,
        activeGoals: (goals ?? []).length,
      }}
      existing={existing ?? null}
    />
  );
}
