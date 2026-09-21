import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";
import { todaysChecklist } from "@/lib/health";

export async function getGreetingName() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const name = profile?.display_name || user.email || "";
  return name.split("@")[0].split(" ")[0];
}

export function timeOfDayGreeting(date = new Date()) {
  const hour = toZonedTime(date, SAST).getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export async function getWatchlist() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reminders")
    .select("*")
    .neq("status", "done")
    .order("severity", { ascending: false })
    .order("due_at", { ascending: true })
    .limit(10);
  return data ?? [];
}

/** Counts only, never medicine names — Health detail stays behind the idle lock. */
export async function getDosesDueSummary() {
  const supabase = await createClient();
  const today = toZonedTime(new Date(), SAST).toISOString().slice(0, 10);

  const [{ data: medicines }, { data: doses }] = await Promise.all([
    supabase.from("medicines").select("*").eq("active", true),
    supabase.from("med_doses").select("*").eq("dose_date", today),
  ]);

  const checklist = todaysChecklist(medicines ?? [], doses ?? [], today);
  const remaining = checklist.filter((c) => !c.dose).length;
  return { total: checklist.length, remaining };
}

export async function getTodayEvents() {
  const supabase = await createClient();
  const zonedNow = toZonedTime(new Date(), SAST);
  const dayStr = zonedNow.toISOString().slice(0, 10);
  const start = fromZonedTime(`${dayStr}T00:00:00`, SAST);
  const end = fromZonedTime(`${dayStr}T23:59:59.999`, SAST);

  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });
  return data ?? [];
}
