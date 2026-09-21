"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TASK_CAPACITY, todaySAST, type TaskTier } from "@/lib/taskConstants";

export async function addTask(title: string, tier: TaskTier) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const today = todaySAST();
  const { count } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("task_date", today)
    .eq("tier", tier);

  if ((count ?? 0) >= TASK_CAPACITY[tier]) {
    return { error: `${tier} is full for today (${TASK_CAPACITY[tier]} max)` };
  }

  const { error } = await supabase
    .from("tasks")
    .insert({ owner_id: user.id, title, tier, task_date: today });

  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function updateTask(id: string, title: string, tier: TaskTier) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: existing } = await supabase.from("tasks").select("tier, task_date").eq("id", id).single();
  if (!existing) return { error: "Task not found" };

  if (existing.tier !== tier) {
    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("task_date", existing.task_date)
      .eq("tier", tier);
    if ((count ?? 0) >= TASK_CAPACITY[tier]) {
      return { error: `${tier} is full for today (${TASK_CAPACITY[tier]} max)` };
    }
  }

  const { error } = await supabase.from("tasks").update({ title, tier }).eq("id", id);
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function toggleTask(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ done }).eq("id", id);
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/today");
  return { error: error?.message ?? null };
}
