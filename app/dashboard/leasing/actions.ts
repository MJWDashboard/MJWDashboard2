"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type LeasingDealInput = {
  building_id: string;
  tenant_id: string;
  prospect_name: string;
  shop_number: string;
  stage: string;
  deal_value: string;
  notes: string;
};

function toNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function createLeasingDeal(input: LeasingDealInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("leasing_deals").insert({
    building_id: input.building_id,
    tenant_id: input.tenant_id || null,
    prospect_name: input.prospect_name || null,
    shop_number: input.shop_number || null,
    stage: input.stage as any,
    deal_value: toNumeric(input.deal_value),
    notes: input.notes || null,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

export async function updateLeasingDeal(id: string, input: LeasingDealInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_deals")
    .update({
      building_id: input.building_id,
      tenant_id: input.tenant_id || null,
      prospect_name: input.prospect_name || null,
      shop_number: input.shop_number || null,
      stage: input.stage as any,
      deal_value: toNumeric(input.deal_value),
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}
