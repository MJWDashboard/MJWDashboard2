"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function createTrip(input: {
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: string;
  notes: string | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("travel_trips").insert(input).select("id").single();
  revalidatePath("/travel");
  return { error: error?.message ?? null, id: data?.id ?? null };
}

export async function updateTrip(id: string, fields: TablesUpdate<"travel_trips">) {
  const supabase = await createClient();
  const { error } = await supabase.from("travel_trips").update(fields).eq("id", id);
  revalidatePath("/travel");
  return { error: error?.message ?? null };
}

export async function deleteTrip(id: string) {
  const supabase = await createClient();
  await supabase.from("travel_trips").delete().eq("id", id);
  revalidatePath("/travel");
}

export async function createTripItem(input: {
  trip_id: string;
  kind: string;
  title: string;
  detail: string | null;
  cost: number | null;
}) {
  const supabase = await createClient();
  const { count } = await supabase.from("travel_items").select("id", { count: "exact", head: true }).eq("trip_id", input.trip_id);
  await supabase.from("travel_items").insert({ ...input, position: count ?? 0 });
  revalidatePath("/travel");
}

export async function toggleTripItem(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("travel_items").update({ done }).eq("id", id);
  revalidatePath("/travel");
}

export async function deleteTripItem(id: string) {
  const supabase = await createClient();
  await supabase.from("travel_items").delete().eq("id", id);
  revalidatePath("/travel");
}
