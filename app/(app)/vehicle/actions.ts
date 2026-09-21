"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function createVehicle(input: {
  make: string;
  model: string;
  year: number | null;
  registration: string | null;
  fuel_type: string;
  odometer: number;
  licence_disc_expiry?: string | null;
  warranty_end?: string | null;
  insurer?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert(input);
  revalidatePath("/vehicle");
  return { error: error?.message ?? null };
}

export async function updateVehicle(id: string, fields: TablesUpdate<"vehicles">) {
  const supabase = await createClient();
  await supabase.from("vehicles").update(fields).eq("id", id);
  revalidatePath("/vehicle");
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient();
  await supabase.from("vehicles").delete().eq("id", id);
  revalidatePath("/vehicle");
}

export async function addFuelLog(input: {
  vehicle_id: string;
  occurred_at: string;
  litres: number;
  price_per_litre: number | null;
  total: number;
  odometer: number;
  full_tank: boolean;
  station: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("fuel_logs").insert(input);
  if (!error) {
    await supabase.from("vehicles").update({ odometer: input.odometer }).eq("id", input.vehicle_id);
  }
  revalidatePath("/vehicle");
  return { error: error?.message ?? null };
}

export async function deleteFuelLog(id: string) {
  const supabase = await createClient();
  await supabase.from("fuel_logs").delete().eq("id", id);
  revalidatePath("/vehicle");
}

export async function addService(input: {
  vehicle_id: string;
  occurred_at: string;
  odometer: number | null;
  provider: string | null;
  work_done: string | null;
  cost: number | null;
  next_due_odometer: number | null;
  next_due_date: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert(input);
  revalidatePath("/vehicle");
  return { error: error?.message ?? null };
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/vehicle");
}

export async function addTrip(input: {
  vehicle_id: string;
  occurred_at: string;
  from_location: string | null;
  to_location: string | null;
  odometer_start: number | null;
  odometer_end: number | null;
  purpose: "business" | "private";
  reimbursed: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("trips").insert(input);
  revalidatePath("/vehicle");
  return { error: error?.message ?? null };
}

export async function deleteTrip(id: string) {
  const supabase = await createClient();
  await supabase.from("trips").delete().eq("id", id);
  revalidatePath("/vehicle");
}
