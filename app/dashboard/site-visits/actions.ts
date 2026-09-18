"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type SiteVisitInput = {
  building_id: string;
  visit_date: string;
  observations: string;
  risks: string;
  status: string;
};

export async function createSiteVisit(input: SiteVisitInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("site_visits").insert({
    building_id: input.building_id,
    visit_date: input.visit_date,
    observations: input.observations || null,
    risks: input.risks || null,
    status: input.status as any,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/site-visits");
  return { error: null };
}

export async function updateSiteVisit(id: string, input: SiteVisitInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("site_visits")
    .update({
      building_id: input.building_id,
      visit_date: input.visit_date,
      observations: input.observations || null,
      risks: input.risks || null,
      status: input.status as any,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/site-visits");
  return { error: null };
}
