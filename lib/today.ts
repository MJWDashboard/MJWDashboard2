import { createClient } from "@/lib/supabase/server";

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

export async function getTodayEvents() {
  const supabase = await createClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });
  return data ?? [];
}
