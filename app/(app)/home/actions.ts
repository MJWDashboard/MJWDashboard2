"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function createMaintenanceItem(input: {
  item: string;
  issue: string | null;
  date_reported: string;
  contractor: string | null;
  cost: number | null;
  next_service_date: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("home_maintenance").insert({ ...input, status: "open" });
  revalidatePath("/home");
  return { error: error?.message ?? null };
}

export async function updateMaintenanceItem(id: string, fields: TablesUpdate<"home_maintenance">) {
  const supabase = await createClient();
  const { error } = await supabase.from("home_maintenance").update(fields).eq("id", id);
  revalidatePath("/home");
  return { error: error?.message ?? null };
}

export async function deleteMaintenanceItem(id: string) {
  const supabase = await createClient();
  await supabase.from("home_maintenance").delete().eq("id", id);
  revalidatePath("/home");
}

export async function createHomeContact(input: { name: string; role: string | null; phone: string | null; notes: string | null }) {
  const supabase = await createClient();
  const { error } = await supabase.from("home_contacts").insert(input);
  revalidatePath("/home");
  return { error: error?.message ?? null };
}

export async function updateHomeContact(id: string, fields: TablesUpdate<"home_contacts">) {
  const supabase = await createClient();
  const { error } = await supabase.from("home_contacts").update(fields).eq("id", id);
  revalidatePath("/home");
  return { error: error?.message ?? null };
}

export async function deleteHomeContact(id: string) {
  const supabase = await createClient();
  await supabase.from("home_contacts").delete().eq("id", id);
  revalidatePath("/home");
}
