"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type ImportantDateInput = {
  title: string;
  building_id: string;
  tenant_id: string;
  date_type: string;
  due_date: string;
  status: string;
  notes: string;
};

export async function createImportantDate(input: ImportantDateInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("important_dates").insert({
    title: input.title,
    building_id: input.building_id || null,
    tenant_id: input.tenant_id || null,
    date_type: input.date_type || null,
    due_date: input.due_date,
    status: input.status as any,
    notes: input.notes || null,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/calendar");
  return { error: null };
}

export async function updateImportantDate(id: string, input: ImportantDateInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("important_dates")
    .update({
      title: input.title,
      building_id: input.building_id || null,
      tenant_id: input.tenant_id || null,
      date_type: input.date_type || null,
      due_date: input.due_date,
      status: input.status as any,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/calendar");
  return { error: null };
}
