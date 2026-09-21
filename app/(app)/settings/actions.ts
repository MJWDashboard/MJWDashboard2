"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateName(firstName: string, lastName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName || null, last_name: lastName || null, display_name: displayName })
    .eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

export async function submitTicket(subject: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", ticketNumber: null };

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({ owner_id: user.id, reporter_email: user.email ?? "", subject, message })
    .select("ticket_number")
    .single();

  if (error) return { error: error.message, ticketNumber: null };
  return { error: null, ticketNumber: data.ticket_number };
}
