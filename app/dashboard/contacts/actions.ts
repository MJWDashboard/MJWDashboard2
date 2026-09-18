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
  office_number: string;
  emergency_number: string;
  after_hours_number: string;
  building_id: string;
  active: boolean;
  notes: string;
};

function buildPayload(input: ContactInput) {
  return {
    name: input.name,
    type: input.type as any,
    company: input.company || null,
    email: input.email || null,
    phone: input.phone || null,
    office_number: input.office_number || null,
    emergency_number: input.emergency_number || null,
    after_hours_number: input.after_hours_number || null,
    building_id: input.building_id || null,
    active: input.active,
    notes: input.notes || null,
  };
}

export async function createContact(input: ContactInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("contacts").insert({
    ...buildPayload(input),
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
      ...buildPayload(input),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/contacts");
  return { error: null };
}

export async function getExistingContactsForImport() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, building_id, name")
    .is("archived_at", null);

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export type ContactImportRow = {
  category: "new" | "update";
  contactId: string | null;
  buildingId: string | null;
  name: string;
  type: string;
  company: string;
  email: string;
  phone: string;
  officeNumber: string;
};

export async function commitContactImport(rows: ContactImportRow[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", imported: 0 };

  const supabase = createClient();
  let imported = 0;

  for (const row of rows) {
    const payload = {
      name: row.name,
      type: row.type as any,
      company: row.company || null,
      email: row.email || null,
      phone: row.phone || null,
      office_number: row.officeNumber || null,
      building_id: row.buildingId,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (row.category === "update" && row.contactId) {
      const { error } = await supabase.from("contacts").update(payload).eq("id", row.contactId);
      if (!error) imported += 1;
    } else {
      const { error } = await supabase.from("contacts").insert({
        ...payload,
        organization_id: user.organizationId,
        created_by: user.id,
      });
      if (!error) imported += 1;
    }
  }

  revalidatePath("/dashboard/contacts");
  return { error: null, imported };
}
