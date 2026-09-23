import { createClient } from "@/lib/supabase/server";
import { HealthClient } from "./HealthClient";

export const metadata = { title: "Wellness" };

export default async function HealthPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [{ data: medicines }, { data: doses }, { data: appointments }, { data: weights }] = await Promise.all([
    supabase.from("medicines").select("*").order("created_at", { ascending: true }),
    supabase.from("med_doses").select("*").eq("dose_date", today),
    supabase.from("appointments").select("*").order("appointment_at", { ascending: true }),
    supabase
      .from("health_metrics")
      .select("*")
      .eq("metric", "weight")
      .gte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: true }),
  ]);

  return (
    <HealthClient
      medicines={medicines ?? []}
      doses={doses ?? []}
      appointments={appointments ?? []}
      weights={weights ?? []}
      today={today}
    />
  );
}
