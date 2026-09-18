"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type TurnoverInput = {
  tenant_id: string;
  building_id: string;
  period: string;
  turnover_amount: string;
  turnover_rental: string;
  submitted: boolean;
  notes: string;
};

function toNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function createTurnover(input: TurnoverInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("turnovers").insert({
    tenant_id: input.tenant_id,
    building_id: input.building_id,
    period: input.period,
    turnover_amount: toNumeric(input.turnover_amount),
    turnover_rental: toNumeric(input.turnover_rental),
    submitted: input.submitted,
    submitted_at: input.submitted ? new Date().toISOString() : null,
    notes: input.notes || null,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnovers");
  return { error: null };
}

export async function updateTurnover(id: string, input: TurnoverInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("turnovers")
    .update({
      tenant_id: input.tenant_id,
      building_id: input.building_id,
      period: input.period,
      turnover_amount: toNumeric(input.turnover_amount),
      turnover_rental: toNumeric(input.turnover_rental),
      submitted: input.submitted,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnovers");
  return { error: null };
}
