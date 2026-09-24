import { createClient } from "@/lib/supabase/server";
import { HealthClient } from "./HealthClient";

export const metadata = { title: "Wellness" };

export default async function HealthPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: medicines },
    { data: doses },
    { data: appointments },
    { data: weights },
    { data: habits },
    { data: habitLogs },
    { data: wellnessEntries },
    { data: sleepEntries },
    { data: profile },
  ] = await Promise.all([
    supabase.from("medicines").select("*").order("created_at", { ascending: true }),
    supabase.from("med_doses").select("*").eq("dose_date", today),
    supabase.from("appointments").select("*").order("appointment_at", { ascending: true }),
    supabase
      .from("health_metrics")
      .select("*")
      .eq("metric", "weight")
      .gte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: true }),
    supabase.from("habits").select("*").order("created_at", { ascending: true }),
    supabase.from("habit_logs").select("*").gte("log_date", thirtyDaysAgo),
    supabase.from("wellness_entries").select("*").order("entry_date", { ascending: false }).limit(30),
    supabase.from("sleep_entries").select("*").order("sleep_date", { ascending: false }).limit(30),
    user ? supabase.from("profiles").select("target_weight, height_cm").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  return (
    <HealthClient
      medicines={medicines ?? []}
      doses={doses ?? []}
      appointments={appointments ?? []}
      weights={weights ?? []}
      today={today}
      habits={habits ?? []}
      habitLogs={habitLogs ?? []}
      wellnessEntries={wellnessEntries ?? []}
      sleepEntries={sleepEntries ?? []}
      targetWeight={profile?.target_weight ?? null}
      heightCm={profile?.height_cm ?? null}
    />
  );
}
