"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function createLifeAdminItem(input: {
  title: string;
  category: string;
  due_date: string | null;
  lead_days: number[];
  notes: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("life_admin_items").insert({ ...input, status: "current" });
  revalidatePath("/life-admin");
  return { error: error?.message ?? null };
}

export async function updateLifeAdminItem(id: string, fields: TablesUpdate<"life_admin_items">) {
  const supabase = await createClient();
  const { error } = await supabase.from("life_admin_items").update(fields).eq("id", id);
  revalidatePath("/life-admin");
  return { error: error?.message ?? null };
}

export async function markLifeAdminComplete(id: string, complete: boolean) {
  const supabase = await createClient();
  await supabase.from("life_admin_items").update({ status: complete ? "complete" : "current" }).eq("id", id);
  revalidatePath("/life-admin");
}

export async function deleteLifeAdminItem(id: string) {
  const supabase = await createClient();
  await supabase.from("life_admin_items").delete().eq("id", id);
  revalidatePath("/life-admin");
}
