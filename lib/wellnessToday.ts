import { createClient } from "@/lib/supabase/server";
import { getDosesDueSummary } from "@/lib/today";
import { todaySAST } from "@/lib/planTasks";

export type WellnessToday = {
  dosesTotal: number;
  dosesRemaining: number;
  appointmentsToday: number;
  lastWeightKg: number | null;
};

export async function getWellnessToday(): Promise<WellnessToday> {
  const supabase = await createClient();
  const today = todaySAST();

  const [doses, { count: appointmentsToday }, { data: weights }] = await Promise.all([
    getDosesDueSummary(),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("completed", false)
      .gte("appointment_at", `${today}T00:00:00`)
      .lte("appointment_at", `${today}T23:59:59`),
    supabase.from("health_metrics").select("value").eq("metric", "weight").order("recorded_at", { ascending: false }).limit(1),
  ]);

  return {
    dosesTotal: doses.total,
    dosesRemaining: doses.remaining,
    appointmentsToday: appointmentsToday ?? 0,
    lastWeightKg: weights?.[0]?.value ?? null,
  };
}
