"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export async function getArrearsComments(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("arrears_comments")
    .select("id, comment, follow_up_date, status, promise_to_pay_date, promise_to_pay_amount, escalation, created_at")
    .eq("tenant_id", tenantId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export type ArrearsCommentInput = {
  tenant_id: string;
  building_id: string;
  comment: string;
  follow_up_date: string;
  promise_to_pay_date: string;
  promise_to_pay_amount: string;
  escalation: boolean;
};

export async function addArrearsComment(input: ArrearsCommentInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("arrears_comments").insert({
    tenant_id: input.tenant_id,
    building_id: input.building_id,
    comment: input.comment,
    follow_up_date: input.follow_up_date || null,
    promise_to_pay_date: input.promise_to_pay_date || null,
    promise_to_pay_amount: input.promise_to_pay_amount ? Number(input.promise_to_pay_amount) : null,
    escalation: input.escalation,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/arrears");
  return { error: null };
}

export async function updateArrearsStatus(tenantId: string, status: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("arrears_current")
    .update({ status: status as any, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId);

  if (error) return { error: error.message };
  revalidatePath("/arrears");
  return { error: null };
}
