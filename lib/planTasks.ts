import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";
import { todaySAST, type Task, type PlanView } from "@/lib/planTypes";

export type { Task, PlanView } from "@/lib/planTypes";
export { PRIORITY_LABEL, STATUS_LABEL, todaySAST } from "@/lib/planTypes";

const OPEN_STATUSES = ["inbox", "planned", "in_progress", "waiting"];

function isoDaysFromToday(days: number) {
  const d = toZonedTime(new Date(), SAST);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function endOfWeekISO() {
  const d = toZonedTime(new Date(), SAST);
  const diff = 7 - d.getDay() || 7; // through Sunday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function endOfMonthISO() {
  const d = toZonedTime(new Date(), SAST);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return end.toISOString().slice(0, 10);
}

/** Fetches the task list for one Plan view. Subtasks (parent_task_id set)
 * are excluded from every view except when explicitly requested via
 * getSubtasks — they show nested under their parent in the UI instead. */
export async function getTasksForView(view: PlanView): Promise<Task[]> {
  const supabase = await createClient();
  const today = todaySAST();

  let query = supabase.from("tasks").select("*").is("parent_task_id", null);

  if (view === "today") {
    query = query.eq("due_date", today).in("status", [...OPEN_STATUSES, "complete"]);
  } else if (view === "tomorrow") {
    query = query.eq("due_date", isoDaysFromToday(1)).in("status", OPEN_STATUSES);
  } else if (view === "week") {
    query = query.gte("due_date", today).lte("due_date", endOfWeekISO()).in("status", OPEN_STATUSES);
  } else if (view === "month") {
    query = query.gte("due_date", today).lte("due_date", endOfMonthISO()).in("status", OPEN_STATUSES);
  } else if (view === "upcoming") {
    query = query.gt("due_date", today).in("status", OPEN_STATUSES);
  } else if (view === "backlog") {
    query = query.is("due_date", null).in("status", OPEN_STATUSES);
  }

  const { data } = await query.order("priority", { ascending: true }).order("position", { ascending: true });
  return data ?? [];
}

export async function getSubtasks(parentId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select("*").eq("parent_task_id", parentId).order("position");
  return data ?? [];
}

/** Overdue open tasks — Morning Review step 1 ("carried over from yesterday"). */
export async function getCarriedOverTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .lt("due_date", todaySAST())
    .in("status", OPEN_STATUSES)
    .is("parent_task_id", null)
    .order("due_date", { ascending: true });
  return data ?? [];
}

/** Today's Top Priorities — max 3, per the Today command-centre spec. */
export async function getTodayPriorities(): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("due_date", todaySAST())
    .eq("is_today_priority", true)
    .neq("status", "cancelled")
    .order("position", { ascending: true })
    .limit(3);
  return data ?? [];
}

/** Candidate pool for "pick today's 3 priorities" in the Morning Review —
 * anything open that's due today, overdue, or sitting in the backlog. */
export async function getPriorityCandidates(): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .in("status", OPEN_STATUSES)
    .is("parent_task_id", null)
    .or(`due_date.lte.${todaySAST()},due_date.is.null`)
    .order("priority", { ascending: true });
  return data ?? [];
}

export async function getTodayOpenTaskCount(): Promise<{ total: number; done: number }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("status")
    .eq("due_date", todaySAST())
    .is("parent_task_id", null);
  const rows = data ?? [];
  return { total: rows.length, done: rows.filter((r) => r.status === "complete").length };
}

/** Simple capacity check: sums estimated_minutes for tasks due today against
 * a fixed working window (08:00-18:00) minus the day's calendar events. */
export async function getCapacityForToday(): Promise<{ plannedMinutes: number; availableMinutes: number }> {
  const supabase = await createClient();
  const today = todaySAST();

  const [{ data: tasks }, { data: events }] = await Promise.all([
    supabase.from("tasks").select("estimated_minutes").eq("due_date", today).in("status", OPEN_STATUSES),
    supabase.from("events").select("starts_at, ends_at, all_day").gte("starts_at", `${today}T00:00:00`).lte("starts_at", `${today}T23:59:59`),
  ]);

  const plannedMinutes = (tasks ?? []).reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0);

  const WORK_WINDOW_MINUTES = 10 * 60; // 08:00–18:00
  const busyMinutes = (events ?? [])
    .filter((e) => !e.all_day && e.ends_at)
    .reduce((sum, e) => sum + Math.max(0, (new Date(e.ends_at!).getTime() - new Date(e.starts_at).getTime()) / 60000), 0);

  return { plannedMinutes, availableMinutes: Math.max(0, WORK_WINDOW_MINUTES - busyMinutes) };
}
