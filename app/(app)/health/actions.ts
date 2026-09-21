"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createMedicine(input: {
  name: string;
  strength: string | null;
  dose_text: string | null;
  schedule: string[];
  stock_on_hand: number;
  pharmacy: string | null;
  monthly_collection_date: string | null;
  script_expiry?: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("medicines").insert(input);
  revalidatePath("/health");
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function deleteMedicine(id: string) {
  const supabase = await createClient();
  await supabase.from("medicines").delete().eq("id", id);
  revalidatePath("/health");
  revalidatePath("/today");
}

export async function logDose(medicineId: string, timeSlot: string, status: "taken" | "skipped", skipReason?: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  await supabase.from("med_doses").upsert(
    { medicine_id: medicineId, dose_date: today, time_slot: timeSlot, status, skip_reason: skipReason ?? null },
    { onConflict: "medicine_id,dose_date,time_slot" }
  );

  if (status === "taken") {
    const { data: med } = await supabase.from("medicines").select("stock_on_hand").eq("id", medicineId).single();
    if (med) {
      await supabase.from("medicines").update({ stock_on_hand: Math.max(0, med.stock_on_hand - 1) }).eq("id", medicineId);
    }
  }

  revalidatePath("/health");
  revalidatePath("/today");
}

export async function createAppointment(input: {
  provider: string;
  purpose: string | null;
  appointment_at: string;
  follow_up_date: string | null;
  cost: number | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").insert(input);
  revalidatePath("/health");
  return { error: error?.message ?? null };
}

export async function toggleAppointmentCompleted(id: string, completed: boolean) {
  const supabase = await createClient();
  await supabase.from("appointments").update({ completed }).eq("id", id);
  revalidatePath("/health");
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  await supabase.from("appointments").delete().eq("id", id);
  revalidatePath("/health");
}

export async function logWeight(value: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("health_metrics").insert({
    metric: "weight",
    value,
    unit: "kg",
    recorded_at: new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/health");
  return { error: error?.message ?? null };
}
