"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { MAX_PHOTO_BYTES, formatBytes } from "@/lib/uploadLimits";

export type SiteVisitInput = {
  building_id: string;
  visit_date: string;
  start_time: string;
  visit_type: string;
  attendees: string;
  weather: string;
  observations: string;
  risks: string;
  status: string;
};

function buildVisitPayload(input: SiteVisitInput, propertyManagerId?: string) {
  return {
    building_id: input.building_id,
    visit_date: input.visit_date,
    start_time: input.start_time || null,
    visit_type: input.visit_type || null,
    attendees: input.attendees || null,
    weather: input.weather || null,
    observations: input.observations || null,
    risks: input.risks || null,
    status: input.status as any,
    ...(propertyManagerId ? { property_manager: propertyManagerId } : {}),
  };
}

export async function createSiteVisit(input: SiteVisitInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", id: null };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_visits")
    .insert({
      ...buildVisitPayload(input, user.id),
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, id: null };
  revalidatePath("/dashboard/site-visits");
  return { error: null, id: data.id as string };
}

export async function updateSiteVisit(id: string, input: SiteVisitInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("site_visits")
    .update({
      ...buildVisitPayload(input),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/site-visits");
  revalidatePath(`/dashboard/site-visits/${id}`);
  return { error: null };
}

export type SiteVisitItemInput = {
  site_visit_id: string;
  category: string;
  location: string;
  tenant_id: string;
  description: string;
  risk_level: string;
  priority: string;
  contractor_id: string;
  target_date: string;
  status: string;
  notes: string;
};

export async function createSiteVisitItem(input: SiteVisitItemInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", id: null };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_visit_items")
    .insert({
      site_visit_id: input.site_visit_id,
      category: input.category,
      location: input.location || null,
      tenant_id: input.tenant_id || null,
      description: input.description,
      risk_level: input.risk_level as any,
      priority: input.priority as any,
      responsible_person: user.id,
      contractor_id: input.contractor_id || null,
      target_date: input.target_date || null,
      status: input.status as any,
      notes: input.notes || null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, id: null };
  revalidatePath(`/dashboard/site-visits/${input.site_visit_id}`);
  return { error: null, id: data.id as string };
}

export async function updateSiteVisitItem(id: string, siteVisitId: string, input: SiteVisitItemInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("site_visit_items")
    .update({
      category: input.category,
      location: input.location || null,
      tenant_id: input.tenant_id || null,
      description: input.description,
      risk_level: input.risk_level as any,
      priority: input.priority as any,
      contractor_id: input.contractor_id || null,
      target_date: input.target_date || null,
      status: input.status as any,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/site-visits/${siteVisitId}`);
  return { error: null };
}

export async function uploadSiteVisitPhoto(itemId: string, siteVisitId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const file = formData.get("file") as File | null;
  const caption = (formData.get("caption") as string) || null;
  if (!file || file.size === 0) return { error: "No file provided." };
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: `Photo is ${formatBytes(file.size)} - photos are limited to 4 MB.` };
  }

  const supabase = createClient();
  const path = `site-visits/${siteVisitId}/${itemId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("site_visit_photos").insert({
    site_visit_item_id: itemId,
    file_path: path,
    caption,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/site-visits/${siteVisitId}`);
  return { error: null };
}

export async function removeSiteVisitPhoto(id: string, siteVisitId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("site_visit_photos").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/site-visits/${siteVisitId}`);
  return { error: null };
}

export async function getSignedPhotoUrls(paths: string[]) {
  const supabase = createClient();
  const results: Record<string, string> = {};
  for (const path of paths) {
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60 * 30);
    if (data) results[path] = data.signedUrl;
  }
  return results;
}
