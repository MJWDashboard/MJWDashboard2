"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function createPet(input: {
  name: string;
  species: string;
  breed: string | null;
  estimated_age: number | null;
  vet: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("pets").insert(input);
  revalidatePath("/pets");
  return { error: error?.message ?? null };
}

export async function updatePet(id: string, fields: TablesUpdate<"pets">) {
  const supabase = await createClient();
  const { error } = await supabase.from("pets").update(fields).eq("id", id);
  revalidatePath("/pets");
  return { error: error?.message ?? null };
}

export async function deletePet(id: string) {
  const supabase = await createClient();
  await supabase.from("pets").delete().eq("id", id);
  revalidatePath("/pets");
}

export async function addCareItem(input: {
  pet_id: string;
  kind: string;
  label: string;
  interval_days: number | null;
  last_done: string | null;
  next_due: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("pet_care_items").insert(input);
  revalidatePath("/pets");
  return { error: error?.message ?? null };
}

export async function markCareDone(id: string, intervalDays: number | null) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  let nextDue: string | null = null;
  if (intervalDays) {
    const d = new Date();
    d.setDate(d.getDate() + intervalDays);
    nextDue = d.toISOString().slice(0, 10);
  }
  await supabase.from("pet_care_items").update({ last_done: today, next_due: nextDue }).eq("id", id);
  revalidatePath("/pets");
}

export async function updateCareItem(id: string, fields: TablesUpdate<"pet_care_items">) {
  const supabase = await createClient();
  const { error } = await supabase.from("pet_care_items").update(fields).eq("id", id);
  revalidatePath("/pets");
  return { error: error?.message ?? null };
}

export async function deleteCareItem(id: string) {
  const supabase = await createClient();
  await supabase.from("pet_care_items").delete().eq("id", id);
  revalidatePath("/pets");
}

export async function addVisit(input: {
  pet_id: string;
  occurred_at: string;
  reason: string | null;
  cost: number;
  paid_by: "owner" | "garth";
  split_pct: number;
  weight_kg: number | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("pet_visits").insert(input);
  revalidatePath("/pets");
  return { error: error?.message ?? null };
}

export async function toggleVisitSettled(id: string, settled: boolean) {
  const supabase = await createClient();
  await supabase.from("pet_visits").update({ settled }).eq("id", id);
  revalidatePath("/pets");
}

export async function updateVisit(id: string, fields: TablesUpdate<"pet_visits">) {
  const supabase = await createClient();
  const { error } = await supabase.from("pet_visits").update(fields).eq("id", id);
  revalidatePath("/pets");
  return { error: error?.message ?? null };
}

export async function deleteVisit(id: string) {
  const supabase = await createClient();
  await supabase.from("pet_visits").delete().eq("id", id);
  revalidatePath("/pets");
}

export async function createAsset(input: {
  item: string;
  category: string | null;
  purchase_price: number | null;
  replacement_value: number | null;
  warranty_expiry: string | null;
  insured: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("assets").insert(input);
  revalidatePath("/pets");
  return { error: error?.message ?? null };
}

export async function updateAsset(id: string, fields: TablesUpdate<"assets">) {
  const supabase = await createClient();
  const { error } = await supabase.from("assets").update(fields).eq("id", id);
  revalidatePath("/pets");
  return { error: error?.message ?? null };
}

export async function deleteAsset(id: string) {
  const supabase = await createClient();
  await supabase.from("assets").delete().eq("id", id);
  revalidatePath("/pets");
}
