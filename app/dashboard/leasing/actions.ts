"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

function toNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function toInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// ---------- Leasing Deals ----------

export type LeasingDealInput = {
  building_id: string;
  tenant_id: string;
  vacant_unit_id: string;
  prospect_name: string;
  shop_number: string;
  stage: string;
  deal_value: string;
  enquiry_date: string;
  enquiry_source: string;
  requirements: string;
  contact_email: string;
  contact_phone: string;
  unit_size_sqm: string;
  rate_per_sqm: string;
  lease_term_months: string;
  commencement_date: string;
  notes: string;
};

function buildDealPayload(input: LeasingDealInput) {
  return {
    building_id: input.building_id,
    tenant_id: input.tenant_id || null,
    vacant_unit_id: input.vacant_unit_id || null,
    prospect_name: input.prospect_name || null,
    shop_number: input.shop_number || null,
    stage: input.stage as any,
    deal_value: toNumeric(input.deal_value),
    enquiry_date: input.enquiry_date || null,
    enquiry_source: input.enquiry_source || null,
    requirements: input.requirements || null,
    contact_email: input.contact_email || null,
    contact_phone: input.contact_phone || null,
    unit_size_sqm: toNumeric(input.unit_size_sqm),
    rate_per_sqm: toNumeric(input.rate_per_sqm),
    lease_term_months: toInt(input.lease_term_months),
    commencement_date: input.commencement_date || null,
    notes: input.notes || null,
  };
}

export async function createLeasingDeal(input: LeasingDealInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", id: null };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("leasing_deals")
    .insert({ ...buildDealPayload(input), created_by: user.id, updated_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message, id: null };

  if (input.vacant_unit_id) {
    await supabase.from("vacant_units").update({ status: "under_offer" }).eq("id", input.vacant_unit_id);
  }

  revalidatePath("/dashboard/leasing");
  return { error: null, id: data.id as string };
}

export async function updateLeasingDeal(id: string, input: LeasingDealInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_deals")
    .update({ ...buildDealPayload(input), updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  if (input.vacant_unit_id) {
    const nextStatus = input.stage === "signed" ? "leased" : "under_offer";
    await supabase.from("vacant_units").update({ status: nextStatus }).eq("id", input.vacant_unit_id);
  }

  revalidatePath("/dashboard/leasing");
  revalidatePath(`/dashboard/leasing/${id}`);
  return { error: null };
}

export async function addLeasingDealFeedback(dealId: string, comment: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };
  if (!comment.trim()) return { error: "Feedback cannot be empty." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_deal_feedback")
    .insert({ deal_id: dealId, comment: comment.trim(), created_by: user.id });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/leasing/${dealId}`);
  return { error: null };
}

// ---------- Document checklist ----------

export async function applyDocumentTemplate(dealId: string, templateId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { data: template } = await supabase
    .from("leasing_document_templates")
    .select("items")
    .eq("id", templateId)
    .maybeSingle();

  if (!template) return { error: "Template not found." };

  const { data: existingItems } = await supabase
    .from("leasing_deal_documents")
    .select("document_name")
    .eq("deal_id", dealId);

  const existingNames = new Set((existingItems ?? []).map((i) => i.document_name.toLowerCase()));
  const items = (template.items as unknown as string[]).filter(
    (name) => !existingNames.has(name.toLowerCase())
  );

  if (items.length > 0) {
    await supabase
      .from("leasing_deal_documents")
      .insert(items.map((document_name) => ({ deal_id: dealId, document_name })));
  }

  revalidatePath(`/dashboard/leasing/${dealId}`);
  return { error: null };
}

export async function addDealDocumentItem(dealId: string, documentName: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };
  if (!documentName.trim()) return { error: "Document name is required." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_deal_documents")
    .insert({ deal_id: dealId, document_name: documentName.trim() });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/leasing/${dealId}`);
  return { error: null };
}

export async function toggleDealDocumentReceived(itemId: string, dealId: string, received: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_deal_documents")
    .update({ received, received_at: received ? new Date().toISOString() : null })
    .eq("id", itemId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/leasing/${dealId}`);
  return { error: null };
}

// ---------- Vacant Units ----------

export type VacantUnitInput = {
  building_id: string;
  shop_number: string;
  size_sqm: string;
  asking_rate_per_sqm: string;
  availability_date: string;
  status: string;
  notes: string;
};

export async function createVacantUnit(input: VacantUnitInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("vacant_units").insert({
    building_id: input.building_id,
    shop_number: input.shop_number || null,
    size_sqm: toNumeric(input.size_sqm),
    asking_rate_per_sqm: toNumeric(input.asking_rate_per_sqm),
    availability_date: input.availability_date || null,
    status: input.status as any,
    notes: input.notes || null,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

export async function updateVacantUnit(id: string, input: VacantUnitInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("vacant_units")
    .update({
      building_id: input.building_id,
      shop_number: input.shop_number || null,
      size_sqm: toNumeric(input.size_sqm),
      asking_rate_per_sqm: toNumeric(input.asking_rate_per_sqm),
      availability_date: input.availability_date || null,
      status: input.status as any,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

// ---------- Target Lists ----------

export type LeasingTargetInput = {
  building_id: string;
  company_name: string;
  trade_category: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  notes: string;
};

export async function createLeasingTarget(input: LeasingTargetInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("leasing_targets").insert({
    building_id: input.building_id,
    company_name: input.company_name,
    trade_category: input.trade_category || null,
    contact_name: input.contact_name || null,
    contact_email: input.contact_email || null,
    contact_phone: input.contact_phone || null,
    status: input.status as any,
    notes: input.notes || null,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

export async function updateLeasingTarget(id: string, input: LeasingTargetInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_targets")
    .update({
      building_id: input.building_id,
      company_name: input.company_name,
      trade_category: input.trade_category || null,
      contact_name: input.contact_name || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      status: input.status as any,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

// ---------- Renewals & Risk ----------

export async function updateLeaseRenewalStatus(leaseId: string, status: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leases")
    .update({ renewal_status: status as any, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", leaseId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

export async function addLeaseRenewalNote(leaseId: string, comment: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };
  if (!comment.trim()) return { error: "Note cannot be empty." };

  const supabase = createClient();
  const { error } = await supabase
    .from("lease_renewal_notes")
    .insert({ lease_id: leaseId, comment: comment.trim(), created_by: user.id });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

// ---------- Approved Rates ----------

export type ApprovedRateInput = {
  building_id: string;
  category: string;
  rate_per_sqm: string;
  effective_date: string;
  notes: string;
};

export async function createApprovedRate(input: ApprovedRateInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("leasing_approved_rates").insert({
    building_id: input.building_id,
    category: input.category,
    rate_per_sqm: toNumeric(input.rate_per_sqm) ?? 0,
    effective_date: input.effective_date || null,
    notes: input.notes || null,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

export async function updateApprovedRate(id: string, input: ApprovedRateInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_approved_rates")
    .update({
      building_id: input.building_id,
      category: input.category,
      rate_per_sqm: toNumeric(input.rate_per_sqm) ?? 0,
      effective_date: input.effective_date || null,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

// ---------- Document Templates (org-wide) ----------

export async function createDocumentTemplate(name: string, items: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };
  if (!name.trim()) return { error: "Template name is required." };

  const supabase = createClient();
  const { error } = await supabase.from("leasing_document_templates").insert({
    organization_id: user.organizationId,
    name: name.trim(),
    items: items.filter(Boolean),
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

export async function updateDocumentTemplate(id: string, name: string, items: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_document_templates")
    .update({
      name: name.trim(),
      items: items.filter(Boolean),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}

export async function archiveDocumentTemplate(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("leasing_document_templates")
    .update({ archived_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/leasing");
  return { error: null };
}
