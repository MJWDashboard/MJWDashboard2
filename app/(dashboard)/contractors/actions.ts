"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type ContractorInput = {
  contact_id: string;
  trade: string;
  building_id: string;
  rating: string;
  notes: string;
};

export async function createContractor(input: ContractorInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("contractors").insert({
    contact_id: input.contact_id || null,
    trade: input.trade || null,
    building_id: input.building_id || null,
    rating: input.rating ? Number(input.rating) : null,
    notes: input.notes || null,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/contractors");
  return { error: null };
}

export async function updateContractor(id: string, input: ContractorInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("contractors")
    .update({
      contact_id: input.contact_id || null,
      trade: input.trade || null,
      building_id: input.building_id || null,
      rating: input.rating ? Number(input.rating) : null,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/contractors");
  return { error: null };
}
