"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type ActionItemInput = {
  title: string;
  description: string;
  building_id: string;
  tenant_id: string;
  priority: string;
  status: string;
  due_date: string;
  risk: boolean;
};

export async function createActionItem(input: ActionItemInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("action_items").insert({
    title: input.title,
    description: input.description || null,
    building_id: input.building_id || null,
    tenant_id: input.tenant_id || null,
    priority: input.priority as any,
    status: input.status as any,
    due_date: input.due_date || null,
    risk: input.risk,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/actions");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateActionItem(id: string, input: ActionItemInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("action_items")
    .update({
      title: input.title,
      description: input.description || null,
      building_id: input.building_id || null,
      tenant_id: input.tenant_id || null,
      priority: input.priority as any,
      status: input.status as any,
      due_date: input.due_date || null,
      risk: input.risk,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/actions");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function setActionItemStatus(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("action_items")
    .update({ status: status as any, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/actions");
  revalidatePath("/dashboard");
  return { error: null };
}
