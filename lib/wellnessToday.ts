import { createClient } from "@/lib/supabase/server";
import { getDosesDueSummary } from "@/lib/today";
import { todaySAST } from "@/lib/planTasks";
import { isDueOn } from "@/lib/habits";

export type WellnessToday = {
  dosesTotal: number;
  dosesRemaining: number;
  appointmentsToday: number;
  lastWeightKg: number | null;
  habitsDueToday: number;
  habitsDoneToday: number;
};

export async function getWellnessToday(): Promise<WellnessToday> {
  const supabase = await createClient();
  const today = todaySAST();

  const [doses, { count: appointmentsToday }, { data: weights }, { data: habits }, { data: habitLogs }] = await Promise.all([
    getDosesDueSummary(),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("completed", false)
      .gte("appointment_at", `${today}T00:00:00`)
      .lte("appointment_at", `${today}T23:59:59`),
    supabase.from("health_metrics").select("value").eq("metric", "weight").order("recorded_at", { ascending: false }).limit(1),
    supabase.from("habits").select("*").eq("active", true),
    supabase.from("habit_logs").select("habit_id, completed").eq("log_date", today),
  ]);

  const dueToday = (habits ?? []).filter((h) => isDueOn(h, new Date()));
  const doneIds = new Set((habitLogs ?? []).filter((l) => l.completed).map((l) => l.habit_id));

  return {
    dosesTotal: doses.total,
    dosesRemaining: doses.remaining,
    appointmentsToday: appointmentsToday ?? 0,
    lastWeightKg: weights?.[0]?.value ?? null,
    habitsDueToday: dueToday.length,
    habitsDoneToday: dueToday.filter((h) => doneIds.has(h.id)).length,
  };
}
