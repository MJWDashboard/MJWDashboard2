"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type BuildingInput = {
  name: string;
  address: string;
  gla: string;
  budget: string;
  portfolio_id: string;
  notes: string;
};

function toNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function createBuilding(input: BuildingInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("buildings").insert({
    name: input.name,
    address: input.address || null,
    gla: toNumeric(input.gla),
    budget: toNumeric(input.budget),
    portfolio_id: input.portfolio_id,
    notes: input.notes || null,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/buildings");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateBuilding(id: string, input: BuildingInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("buildings")
    .update({
      name: input.name,
      address: input.address || null,
      gla: toNumeric(input.gla),
      budget: toNumeric(input.budget),
      portfolio_id: input.portfolio_id,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/buildings");
  revalidatePath(`/dashboard/buildings/${id}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function archiveBuilding(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("buildings")
    .update({ archived_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/buildings");
  return { error: null };
}
