import { startOfWeek, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";
import { formatZAR } from "@/lib/money";
import { completionRate, type Habit, type HabitLog } from "@/lib/habits";
import { WeeklyReviewClient } from "./WeeklyReviewClient";

export const metadata = { title: "Weekly Review" };

export default async function WeeklyReviewPage() {
  const supabase = await createClient();
  const today = toZonedTime(new Date(), SAST);
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [{ data: tasks }, { data: transactions }, { data: habits }, { data: habitLogs }, { data: existing }] = await Promise.all([
    supabase.from("tasks").select("id, status, due_date").gte("due_date", sevenDaysAgoStr).lte("due_date", todayStr),
    supabase.from("transactions").select("amount").lt("amount", 0).gte("occurred_at", sevenDaysAgoStr).lte("occurred_at", todayStr),
    supabase.from("habits").select("*").eq("active", true),
    supabase.from("habit_logs").select("*"),
    supabase.from("weekly_reviews").select("*").eq("week_start", weekStart).maybeSingle(),
  ]);

  const tasksDue = tasks ?? [];
  const tasksCompleted = tasksDue.filter((t) => t.status === "complete").length;
  const totalSpend = (transactions ?? []).reduce((s, t) => s + Math.abs(t.amount), 0);
  const habitList = (habits ?? []) as Habit[];
  const logsByHabit = new Map<string, HabitLog[]>();
  for (const log of (habitLogs ?? []) as HabitLog[]) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }
  const avgHabitRate =
    habitList.length > 0
      ? Math.round(habitList.reduce((s, h) => s + completionRate(h, logsByHabit.get(h.id) ?? [], 7), 0) / habitList.length)
      : null;

  return (
    <WeeklyReviewClient
      weekStart={weekStart}
      stats={{
        tasksCompleted,
        tasksDue: tasksDue.length,
        totalSpend: formatZAR(totalSpend),
        avgHabitRate,
      }}
      existing={existing ?? null}
    />
  );
}
