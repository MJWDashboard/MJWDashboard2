"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function createGoal(input: {
  title: string;
  purpose: string | null;
  area: string;
  target: string | null;
  deadline: string | null;
  status: string;
  next_action: string | null;
  linked_savings_goal_id: string | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("goals").insert(input).select("id").single();
  revalidatePath("/goals");
  return { error: error?.message ?? null, id: data?.id ?? null };
}

export async function updateGoal(id: string, fields: TablesUpdate<"goals">) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").update(fields).eq("id", id);
  revalidatePath("/goals");
  return { error: error?.message ?? null };
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  await supabase.from("goals").delete().eq("id", id);
  revalidatePath("/goals");
}

export async function createMilestone(goalId: string, title: string) {
  const supabase = await createClient();
  const { count } = await supabase.from("goal_milestones").select("id", { count: "exact", head: true }).eq("goal_id", goalId);
  await supabase.from("goal_milestones").insert({ goal_id: goalId, title, position: count ?? 0 });
  revalidatePath("/goals");
}

export async function toggleMilestone(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("goal_milestones").update({ done }).eq("id", id);
  revalidatePath("/goals");
}

export async function deleteMilestone(id: string) {
  const supabase = await createClient();
  await supabase.from("goal_milestones").delete().eq("id", id);
  revalidatePath("/goals");
}
