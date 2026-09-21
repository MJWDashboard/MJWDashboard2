"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function logAudit(action: string, table: string, recordId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_log").insert({ action, table_name: table, record_id: recordId ?? null });
}

export async function createDocument(input: {
  doc_type: string;
  issuer: string | null;
  document_date: string | null;
  expiry_date: string | null;
  reference_number: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert(input);
  await logAudit("create", "documents");
  revalidatePath("/vault");
  return { error: error?.message ?? null };
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();
  await supabase.from("documents").delete().eq("id", id);
  await logAudit("delete", "documents", id);
  revalidatePath("/vault");
}

export async function createPolicy(input: {
  insurer: string;
  kind: string;
  policy_number: string | null;
  premium: number | null;
  cover_amount: number | null;
  renewal_date: string | null;
  beneficiary: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("policies").insert(input);
  await logAudit("create", "policies");
  revalidatePath("/vault");
  return { error: error?.message ?? null };
}

export async function deletePolicy(id: string) {
  const supabase = await createClient();
  await supabase.from("policies").delete().eq("id", id);
  await logAudit("delete", "policies", id);
  revalidatePath("/vault");
}

export async function createCredential(input: {
  service: string;
  username: string | null;
  criticality: "tier1" | "tier2";
  two_fa_method: string | null;
  last_password_change: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("credentials").insert(input);
  revalidatePath("/vault");
  return { error: error?.message ?? null };
}

export async function deleteCredential(id: string) {
  const supabase = await createClient();
  await supabase.from("credentials").delete().eq("id", id);
  revalidatePath("/vault");
}

export async function createMatter(input: {
  reference: string | null;
  matter: string;
  authority: string | null;
  next_action: string | null;
  due_date: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("matters").insert(input);
  await logAudit("create", "matters");
  revalidatePath("/vault");
  return { error: error?.message ?? null };
}

export async function updateMatterContact(id: string) {
  const supabase = await createClient();
  await supabase.from("matters").update({ last_contact: new Date().toISOString().slice(0, 10) }).eq("id", id);
  revalidatePath("/vault");
}

export async function closeMatter(id: string) {
  const supabase = await createClient();
  await supabase.from("matters").update({ status: "closed" }).eq("id", id);
  revalidatePath("/vault");
}

export async function deleteMatter(id: string) {
  const supabase = await createClient();
  await supabase.from("matters").delete().eq("id", id);
  await logAudit("delete", "matters", id);
  revalidatePath("/vault");
}
