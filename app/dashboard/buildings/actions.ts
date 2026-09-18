"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { MAX_DOCUMENT_BYTES, formatBytes } from "@/lib/uploadLimits";

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

export type ServiceProviderInput = {
  buildingId: string;
  serviceType: string;
  providerName: string;
  siteSenior: string;
  contactPhone: string;
  contactEmail: string;
  hoursOnSite: string;
  notes: string;
};

export async function createServiceProvider(input: ServiceProviderInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };
  if (!input.providerName.trim()) return { error: "Provider name is required." };

  const supabase = createClient();
  const { error } = await supabase.from("building_service_providers").insert({
    building_id: input.buildingId,
    organization_id: user.organizationId,
    service_type: input.serviceType,
    provider_name: input.providerName.trim(),
    site_senior: input.siteSenior.trim() || null,
    contact_phone: input.contactPhone.trim() || null,
    contact_email: input.contactEmail.trim() || null,
    hours_on_site: input.hoursOnSite.trim() || null,
    notes: input.notes.trim() || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/buildings/${input.buildingId}`);
  return { error: null };
}

export async function updateServiceProvider(id: string, input: ServiceProviderInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };
  if (!input.providerName.trim()) return { error: "Provider name is required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("building_service_providers")
    .update({
      service_type: input.serviceType,
      provider_name: input.providerName.trim(),
      site_senior: input.siteSenior.trim() || null,
      contact_phone: input.contactPhone.trim() || null,
      contact_email: input.contactEmail.trim() || null,
      hours_on_site: input.hoursOnSite.trim() || null,
      notes: input.notes.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/buildings/${input.buildingId}`);
  return { error: null };
}

export async function deleteServiceProvider(id: string, buildingId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("building_service_providers").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/buildings/${buildingId}`);
  return { error: null };
}

const BUILDING_PLAN_CATEGORY = "Building Plan";

export async function uploadBuildingPlan(buildingId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Please choose a file." };
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: `File is ${formatBytes(file.size)} - documents are limited to 20 MB.` };
  }

  const supabase = createClient();
  const path = `${user.organizationId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("documents").insert({
    building_id: buildingId,
    category: BUILDING_PLAN_CATEGORY,
    file_name: file.name,
    file_path: path,
    file_size: file.size,
    mime_type: file.type || null,
    organization_id: user.organizationId,
    uploaded_by: user.id,
  });

  if (insertError) return { error: insertError.message };
  revalidatePath(`/dashboard/buildings/${buildingId}`);
  return { error: null };
}
