import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";
import { todaySAST } from "@/lib/planTasks";

export type MyDayItem = {
  id: string;
  time: string | null; // HH:mm, null = "due today" with no fixed time
  title: string;
  kind: "event" | "task" | "appointment" | "reminder";
  href: string;
};

/** The My Day timeline: calendar events, scheduled tasks, health
 * appointments and today's reminders, one chronological list from morning
 * to evening (timeless items — reminders, unscheduled tasks due today —
 * sort first). */
export async function getMyDay(): Promise<MyDayItem[]> {
  const supabase = await createClient();
  const today = todaySAST();
  const dayStart = fromZonedTime(`${today}T00:00:00`, SAST).toISOString();
  const dayEnd = fromZonedTime(`${today}T23:59:59`, SAST).toISOString();

  const [{ data: events }, { data: appointments }, { data: tasks }, { data: reminders }] = await Promise.all([
    supabase.from("events").select("id, title, starts_at, module").gte("starts_at", dayStart).lte("starts_at", dayEnd),
    supabase.from("appointments").select("id, provider, purpose, appointment_at").eq("completed", false).gte("appointment_at", dayStart).lte("appointment_at", dayEnd),
    supabase.from("tasks").select("id, title, due_time, scheduled_event_id, status").eq("due_date", today).is("parent_task_id", null).neq("status", "complete").neq("status", "cancelled"),
    supabase.from("reminders").select("id, title, due_at, module").eq("status", "pending").gte("due_at", dayStart).lte("due_at", dayEnd),
  ]);

  const items: MyDayItem[] = [];

  for (const e of events ?? []) {
    const t = toZonedTime(new Date(e.starts_at), SAST);
    items.push({ id: `event-${e.id}`, time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`, title: e.title, kind: "event", href: "/calendar" });
  }

  for (const a of appointments ?? []) {
    const t = toZonedTime(new Date(a.appointment_at), SAST);
    items.push({
      id: `appt-${a.id}`,
      time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      title: a.purpose ? `${a.provider} — ${a.purpose}` : a.provider,
      kind: "appointment",
      href: "/health",
    });
  }

  for (const t of tasks ?? []) {
    if (t.scheduled_event_id) continue; // already represented as an event above
    items.push({ id: `task-${t.id}`, time: t.due_time ? t.due_time.slice(0, 5) : null, title: t.title, kind: "task", href: "/plan" });
  }

  for (const r of reminders ?? []) {
    const t = r.due_at ? toZonedTime(new Date(r.due_at), SAST) : null;
    items.push({
      id: `reminder-${r.id}`,
      time: t ? `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}` : null,
      title: r.title,
      kind: "reminder",
      href: "/plan",
    });
  }

  items.sort((a, b) => {
    if (a.time === null && b.time === null) return 0;
    if (a.time === null) return -1;
    if (b.time === null) return 1;
    return a.time.localeCompare(b.time);
  });

  return items;
}
