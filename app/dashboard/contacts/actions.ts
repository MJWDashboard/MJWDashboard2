"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type ContactInput = {
  name: string;
  type: string;
  company: string;
  email: string;
  phone: string;
  building_id: string;
  notes: string;
};

export async function createContact(input: ContactInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("contacts").insert({
    name: input.name,
    type: input.type as any,
    company: input.company || null,
    email: input.email || null,
    phone: input.phone || null,
    building_id: input.building_id || null,
    notes: input.notes || null,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/contacts");
  return { error: null };
}

export async function updateContact(id: string, input: ContactInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      name: input.name,
      type: input.type as any,
      company: input.company || null,
      email: input.email || null,
      phone: input.phone || null,
      building_id: input.building_id || null,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/contacts");
  return { error: null };
}
