"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncGoogleCalendar, disconnectGoogle } from "@/lib/google";

export async function syncGoogleNow() {
  const result = await syncGoogleCalendar();
  revalidatePath("/calendar");
  revalidatePath("/today");
  return result;
}

export async function disconnectGoogleAccount() {
  await disconnectGoogle();
  revalidatePath("/calendar");
}

export async function createEvent(input: {
  title: string;
  starts_at: string;
  location?: string;
  transport_needed?: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    title: input.title,
    starts_at: input.starts_at,
    location: input.location || null,
    transport_needed: input.transport_needed ?? false,
    source: "app",
  });
  revalidatePath("/calendar");
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function toggleTransportConfirmed(id: string, confirmed: boolean) {
  const supabase = await createClient();
  await supabase.from("events").update({ transport_confirmed: confirmed }).eq("id", id);
  revalidatePath("/calendar");
  revalidatePath("/today");
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/calendar");
  revalidatePath("/today");
}

export async function createImportantDate(input: {
  title: string;
  recurrence: "yearly" | "monthly";
  month: number | null;
  day: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("important_dates").insert({
    title: input.title,
    recurrence: input.recurrence,
    month: input.recurrence === "yearly" ? input.month : null,
    day: input.day,
    notes: input.notes || null,
  });
  revalidatePath("/calendar");
  return { error: error?.message ?? null };
}

export async function deleteImportantDate(id: string) {
  const supabase = await createClient();
  await supabase.from("important_dates").delete().eq("id", id);
  revalidatePath("/calendar");
}
