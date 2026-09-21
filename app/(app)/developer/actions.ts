"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Only the developer account can do this" as const };

  return { supabase, user };
}

export async function addUser(formData: FormData) {
  const gate = await requireAdmin();
  if ("error" in gate) return { error: gate.error };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!email || password.length < 8) {
    return { error: "Email and an 8+ character password are required" };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { invited: true },
    user_metadata: { first_name: firstName || null, last_name: lastName || null },
  });

  if (error) return { error: error.message };

  revalidatePath("/developer");
  return { error: null };
}

export async function updateTicketStatus(ticketId: string, status: "open" | "closed") {
  const gate = await requireAdmin();
  if ("error" in gate) return { error: gate.error };

  const { error } = await gate.supabase
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  revalidatePath("/developer");
  return { error: error?.message ?? null };
}
