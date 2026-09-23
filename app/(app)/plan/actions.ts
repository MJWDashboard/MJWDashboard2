"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import { toSastInstant } from "@/lib/captureParser";
import { getTodayPriorities, todaySAST } from "@/lib/planTasks";

function revalidate() {
  revalidatePath("/plan");
  revalidatePath("/today");
}

export type TaskInput = {
  title: string;
  description?: string | null;
  priority?: "critical" | "high" | "normal" | "low";
  status?: string;
  due_date?: string | null;
  due_time?: string | null;
  estimated_minutes?: number | null;
  recurrence_rule?: "none" | "daily" | "weekly" | "monthly";
  tags?: string[];
  notes?: string | null;
  parent_task_id?: string | null;
};

/** Same shape as TaskInput but every field optional — for partial updates
 * (e.g. just flipping status, or just setting estimated_minutes). */
export type TaskUpdateInput = Partial<TaskInput>;

export async function createTask(input: TaskInput) {
  const supabase = await createClient();
  const row: TablesInsert<"tasks"> = {
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? "normal",
    status: input.status ?? (input.due_date ? "planned" : "inbox"),
    due_date: input.due_date ?? null,
    task_date: input.due_date ?? todaySAST(),
    due_time: input.due_time ?? null,
    estimated_minutes: input.estimated_minutes ?? null,
    recurrence_rule: input.recurrence_rule ?? "none",
    tags: input.tags ?? [],
    notes: input.notes ?? null,
    parent_task_id: input.parent_task_id ?? null,
    // tier kept for legacy readers; not surfaced in the new UI.
    tier: input.priority === "critical" ? "critical" : input.priority === "low" ? "admin" : "important",
  };
  const { data, error } = await supabase.from("tasks").insert(row).select("id").single();
  revalidate();
  return { error: error?.message ?? null, id: data?.id ?? null };
}

export async function updateTask(id: string, fields: TaskUpdateInput) {
  const supabase = await createClient();
  const update: TablesUpdate<"tasks"> = { ...fields };
  const { error } = await supabase.from("tasks").update(update).eq("id", id);
  revalidate();
  return { error: error?.message ?? null };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidate();
}

export async function setTaskStatus(id: string, status: string) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ status, done: status === "complete" }).eq("id", id);
  revalidate();
}

/** Enforces the "max 3" Top Priorities rule from the Today command-centre spec. */
export async function setTodayPriority(id: string, value: boolean) {
  if (value) {
    const current = await getTodayPriorities();
    if (current.length >= 3 && !current.some((t) => t.id === id)) {
      return { error: "Today already has 3 priorities — remove one first." };
    }
  }
  const supabase = await createClient();
  await supabase.from("tasks").update({ is_today_priority: value }).eq("id", id);
  revalidate();
  return { error: null };
}

/** Places a task on the calendar as a time block (creates/updates a linked
 * `events` row) and keeps due_date/due_time/estimated_minutes in sync. */
export async function scheduleTask(id: string, input: { date: string; time: string; durationMinutes: number }) {
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("scheduled_event_id, title").eq("id", id).single();
  if (!task) return { error: "Task not found" };

  const startsAt = toSastInstant(input.date, input.time);
  const endsAt = new Date(new Date(startsAt).getTime() + input.durationMinutes * 60000).toISOString();

  let eventId = task.scheduled_event_id;
  if (eventId) {
    await supabase.from("events").update({ title: task.title, starts_at: startsAt, ends_at: endsAt }).eq("id", eventId);
  } else {
    const { data: event } = await supabase
      .from("events")
      .insert({ title: task.title, starts_at: startsAt, ends_at: endsAt, module: "plan", source: "app", record_table: "tasks", record_id: id })
      .select("id")
      .single();
    eventId = event?.id ?? null;
  }

  await supabase
    .from("tasks")
    .update({
      scheduled_event_id: eventId,
      due_date: input.date,
      due_time: input.time,
      estimated_minutes: input.durationMinutes,
      status: "planned",
    })
    .eq("id", id);

  revalidate();
  revalidatePath("/calendar");
  return { error: null };
}

export async function unscheduleTask(id: string) {
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("scheduled_event_id").eq("id", id).single();
  if (task?.scheduled_event_id) {
    await supabase.from("events").delete().eq("id", task.scheduled_event_id);
  }
  await supabase.from("tasks").update({ scheduled_event_id: null }).eq("id", id);
  revalidate();
  revalidatePath("/calendar");
}

/** Capacity-warning resolution: pushes a task's due date out by one day. */
export async function postponeTask(id: string) {
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("due_date").eq("id", id).single();
  if (!task?.due_date) return;
  const next = new Date(task.due_date);
  next.setDate(next.getDate() + 1);
  await supabase.from("tasks").update({ due_date: next.toISOString().slice(0, 10) }).eq("id", id);
  revalidate();
}

/** Marks one of today's (max 3) priorities as the Main Focus — reuses
 * `position` (0 = main focus) rather than a dedicated column. */
export async function setMainFocus(id: string) {
  const supabase = await createClient();
  const priorities = await getTodayPriorities();
  await Promise.all(
    priorities.map((t) => supabase.from("tasks").update({ position: t.id === id ? 0 : 1 }).eq("id", t.id))
  );
  revalidate();
}

export async function saveEveningReview(input: {
  completed_note: string;
  carried_forward_note: string;
  expense_note: string;
  general_note: string;
  overall_rating: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("daily_reviews")
    .upsert({ review_date: todaySAST(), ...input }, { onConflict: "owner_id,review_date" });
  return { error: error?.message ?? null };
}

export async function listSubtasks(parentId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select("*").eq("parent_task_id", parentId).order("position");
  return data ?? [];
}

/** Morning Review step 1 actions on a carried-over task. */
export async function rescheduleTask(id: string, dueDate: string) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ due_date: dueDate, status: "planned" }).eq("id", id);
  revalidate();
}

export async function archiveTask(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ status: "cancelled" }).eq("id", id);
  revalidate();
}

/** Pulls a backlog/overdue task onto today's plan. */
export async function adoptForToday(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ due_date: todaySAST(), status: "planned" }).eq("id", id);
  revalidate();
}

export async function reorderBacklog(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(orderedIds.map((id, position) => supabase.from("tasks").update({ position }).eq("id", id)));
  revalidate();
}

export async function startFocusSession(taskId: string, mode: "stopwatch" | "25" | "50" | "custom", plannedMinutes: number | null) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_focus_sessions")
    .insert({ task_id: taskId, mode, planned_minutes: plannedMinutes })
    .select("id")
    .single();
  return { error: error?.message ?? null, id: data?.id ?? null };
}

export async function endFocusSession(sessionId: string, taskId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase.from("task_focus_sessions").select("started_at").eq("id", sessionId).single();
  if (!session) return;

  const endedAt = new Date();
  const minutes = Math.max(1, Math.round((endedAt.getTime() - new Date(session.started_at).getTime()) / 60000));
  await supabase.from("task_focus_sessions").update({ ended_at: endedAt.toISOString() }).eq("id", sessionId);

  const { data: task } = await supabase.from("tasks").select("actual_minutes").eq("id", taskId).single();
  await supabase.from("tasks").update({ actual_minutes: (task?.actual_minutes ?? 0) + minutes }).eq("id", taskId);
  revalidate();
}
