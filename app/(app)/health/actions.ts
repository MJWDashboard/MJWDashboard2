"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

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

export async function updateMedicine(id: string, fields: TablesUpdate<"medicines">) {
  const supabase = await createClient();
  const { error } = await supabase.from("medicines").update(fields).eq("id", id);
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

export async function resetDose(medicineId: string, timeSlot: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("med_doses")
    .select("status")
    .eq("medicine_id", medicineId)
    .eq("dose_date", today)
    .eq("time_slot", timeSlot)
    .maybeSingle();

  await supabase
    .from("med_doses")
    .delete()
    .eq("medicine_id", medicineId)
    .eq("dose_date", today)
    .eq("time_slot", timeSlot);

  if (existing?.status === "taken") {
    const { data: med } = await supabase.from("medicines").select("stock_on_hand").eq("id", medicineId).single();
    if (med) {
      await supabase.from("medicines").update({ stock_on_hand: med.stock_on_hand + 1 }).eq("id", medicineId);
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

export async function updateAppointment(id: string, fields: TablesUpdate<"appointments">) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update(fields).eq("id", id);
  revalidatePath("/health");
  return { error: error?.message ?? null };
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

export async function updateWeightEntry(id: string, value: number, recordedAt: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("health_metrics").update({ value, recorded_at: recordedAt }).eq("id", id);
  revalidatePath("/health");
  return { error: error?.message ?? null };
}

export async function deleteWeightEntry(id: string) {
  const supabase = await createClient();
  await supabase.from("health_metrics").delete().eq("id", id);
  revalidatePath("/health");
}

// --- Habits -----------------------------------------------------------------

export async function createHabit(input: {
  name: string;
  icon: string;
  category: string | null;
  frequency: string;
  weekdays: number[];
  times_per_week: number | null;
  target: number;
  unit: string | null;
  preferred_time: string | null;
  reminder: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("habits").insert(input);
  revalidatePath("/health");
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function updateHabit(id: string, fields: TablesUpdate<"habits">) {
  const supabase = await createClient();
  const { error } = await supabase.from("habits").update(fields).eq("id", id);
  revalidatePath("/health");
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function deleteHabit(id: string) {
  const supabase = await createClient();
  await supabase.from("habits").delete().eq("id", id);
  revalidatePath("/health");
  revalidatePath("/today");
}

export async function setHabitActive(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("habits").update({ active }).eq("id", id);
  revalidatePath("/health");
}

export async function logHabit(habitId: string, date: string, completed: boolean, skipReason?: string) {
  const supabase = await createClient();
  await supabase
    .from("habit_logs")
    .upsert({ habit_id: habitId, log_date: date, completed, skip_reason: skipReason ?? null }, { onConflict: "habit_id,log_date" });
  revalidatePath("/health");
  revalidatePath("/today");
}

export async function unlogHabit(habitId: string, date: string) {
  const supabase = await createClient();
  await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("log_date", date);
  revalidatePath("/health");
  revalidatePath("/today");
}

// --- Daily check-in -----------------------------------------------------------

export async function saveWellnessEntry(input: {
  entry_date: string;
  mood: number | null;
  energy: number | null;
  stress: number | null;
  sleep_quality: number | null;
  note: string | null;
  symptoms: string | null;
  gratitude: string | null;
  highlight: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("wellness_entries").upsert(input, { onConflict: "owner_id,entry_date" });
  revalidatePath("/health");
  return { error: error?.message ?? null };
}

// --- Sleep -----------------------------------------------------------------

export async function saveSleepEntry(input: {
  sleep_date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_minutes: number | null;
  quality: number | null;
  notes: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("sleep_entries").upsert(input, { onConflict: "owner_id,sleep_date" });
  revalidatePath("/health");
  return { error: error?.message ?? null };
}

export async function deleteSleepEntry(id: string) {
  const supabase = await createClient();
  await supabase.from("sleep_entries").delete().eq("id", id);
  revalidatePath("/health");
}

// --- Profile (weight/height for BMI) ------------------------------------------

export async function updateWellnessProfile(targetWeight: number | null, heightCm: number | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const { error } = await supabase
    .from("profiles")
    .update({ target_weight: targetWeight, height_cm: heightCm })
    .eq("id", user.id);
  revalidatePath("/health");
  return { error: error?.message ?? null };
}
