"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type TenantInput = {
  // Identification
  building_id: string;
  trading_name: string;
  registered_entity: string;
  account_number: string;
  shop_number: string;
  gla: string;
  status: string;
  // Lease
  monthly_rental: string;
  lease_start: string;
  lease_end: string;
  option_period: string;
  escalation_pct: string;
  escalation_date: string;
  operating_costs: string;
  rates: string;
  marketing_charge: string;
  other_charges: string;
  // Security
  deposit_amount: string;
  deposit_type: string;
  bank_guarantee_reference: string;
  surety_name: string;
  surety_expiry: string;
  security_notes: string;
  // Compliance
  fica_status: string;
  insurance_status: string;
  lease_signed: boolean;
  guarantee_received: boolean;
  deposit_received: boolean;
  surety_received: boolean;
  // Turnover obligation
  turnover_reporting_required: boolean;
  monthly_turnover_required: boolean;
  annual_turnover_required: boolean;
  turnover_pct: string;
  financial_year_end_month: string;
  financial_year_end_day: string;
  turnover_penalty_clause: string;
  turnover_penalty_amount: string;
  // Summary
  notes: string;
};

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

function toDate(value: string): string | null {
  return value.trim() ? value : null;
}

function buildPayload(input: TenantInput) {
  return {
    building_id: input.building_id,
    trading_name: input.trading_name,
    registered_entity: input.registered_entity || null,
    account_number: input.account_number || null,
    shop_number: input.shop_number || null,
    gla: toNumeric(input.gla),
    status: input.status as any,
    monthly_rental: toNumeric(input.monthly_rental),
    lease_start: toDate(input.lease_start),
    lease_end: toDate(input.lease_end),
    option_period: input.option_period || null,
    escalation_pct: toNumeric(input.escalation_pct),
    escalation_date: toDate(input.escalation_date),
    operating_costs: toNumeric(input.operating_costs),
    rates: toNumeric(input.rates),
    marketing_charge: toNumeric(input.marketing_charge),
    other_charges: toNumeric(input.other_charges),
    deposit_amount: toNumeric(input.deposit_amount),
    deposit_type: input.deposit_type || null,
    bank_guarantee_reference: input.bank_guarantee_reference || null,
    surety_name: input.surety_name || null,
    surety_expiry: toDate(input.surety_expiry),
    security_notes: input.security_notes || null,
    fica_status: input.fica_status as any,
    insurance_status: input.insurance_status as any,
    lease_signed: input.lease_signed,
    guarantee_received: input.guarantee_received,
    deposit_received: input.deposit_received,
    surety_received: input.surety_received,
    turnover_reporting_required: input.turnover_reporting_required,
    monthly_turnover_required: input.monthly_turnover_required,
    annual_turnover_required: input.annual_turnover_required,
    turnover_pct: toNumeric(input.turnover_pct),
    financial_year_end_month: toInt(input.financial_year_end_month),
    financial_year_end_day: toInt(input.financial_year_end_day),
    turnover_penalty_clause: input.turnover_penalty_clause || null,
    turnover_penalty_amount: toNumeric(input.turnover_penalty_amount),
    notes: input.notes || null,
  };
}

export async function createTenant(input: TenantInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("tenants").insert({
    ...buildPayload(input),
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateTenant(id: string, input: TenantInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      ...buildPayload(input),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/tenants");
  revalidatePath(`/dashboard/tenants/${id}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function addTenantNote(tenantId: string, note: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };
  if (!note.trim()) return { error: "Note cannot be empty." };

  const supabase = createClient();
  const { error } = await supabase.from("tenant_notes").insert({
    tenant_id: tenantId,
    note: note.trim(),
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return { error: null };
}

export type TenantContactInput = {
  tenant_id: string;
  contact_id: string;
  role: string;
  notes: string;
};

export async function addTenantContact(input: TenantContactInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("tenant_contacts").insert({
    tenant_id: input.tenant_id,
    contact_id: input.contact_id,
    role: input.role,
    notes: input.notes || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/tenants/${input.tenant_id}`);
  return { error: null };
}

export async function removeTenantContact(id: string, tenantId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("tenant_contacts").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return { error: null };
}

export async function getExistingTenantsForImport() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, building_id, trading_name")
    .is("archived_at", null);

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export type ImportRow = {
  category: "new" | "update";
  buildingId: string;
  tenantId: string | null;
  tradingName: string;
  shopNumber: string;
  gla: string;
  monthlyRental: string;
  leaseStart: string;
  leaseEnd: string;
  accountNumber: string;
  registeredEntity: string;
};

export async function commitTenantImport(rows: ImportRow[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", imported: 0 };

  const supabase = createClient();
  let imported = 0;

  for (const row of rows) {
    const payload = {
      building_id: row.buildingId,
      trading_name: row.tradingName,
      shop_number: row.shopNumber || null,
      gla: toNumeric(row.gla),
      monthly_rental: toNumeric(row.monthlyRental),
      lease_start: toDate(row.leaseStart),
      lease_end: toDate(row.leaseEnd),
      account_number: row.accountNumber || null,
      registered_entity: row.registeredEntity || null,
      import_source: "excel_import",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (row.category === "update" && row.tenantId) {
      const { error } = await supabase.from("tenants").update(payload).eq("id", row.tenantId);
      if (!error) imported += 1;
    } else {
      const { error } = await supabase
        .from("tenants")
        .insert({ ...payload, created_by: user.id });
      if (!error) imported += 1;
    }
  }

  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
  return { error: null, imported };
}
