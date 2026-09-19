"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { createImportBatch, finalizeImportBatch } from "@/lib/import-batches";
import type { ImportPreviewRow } from "@/lib/imports";
import type { TenantImportData } from "./importUtils";

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

// Tenant identity: who they are. Changes rarely, and never as a side effect
// of a lease renewal.
function buildTenantIdentityPayload(input: TenantInput) {
  return {
    building_id: input.building_id,
    trading_name: input.trading_name,
    registered_entity: input.registered_entity || null,
    account_number: input.account_number || null,
    status: input.status as any,
    notes: input.notes || null,
  };
}

// Lease/occupancy terms: what they're occupying and on what terms. One
// tenant can have many of these over time - only the "active" one drives
// what's shown elsewhere in the app (via a DB trigger that mirrors it back
// onto the tenant row for the read paths that haven't been split out yet).
function buildLeasePayload(input: TenantInput) {
  return {
    building_id: input.building_id,
    shop_number: input.shop_number || null,
    gla: toNumeric(input.gla),
    lease_start: toDate(input.lease_start),
    lease_end: toDate(input.lease_end),
    option_period: input.option_period || null,
    base_rental: toNumeric(input.monthly_rental),
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
    fica_status: input.fica_status || null,
    insurance_status: input.insurance_status || null,
    lease_signed: input.lease_signed,
    deposit_received: input.deposit_received,
    guarantee_received: input.guarantee_received,
    surety_received: input.surety_received,
    turnover_reporting_required: input.turnover_reporting_required,
    monthly_turnover_required: input.monthly_turnover_required,
    annual_turnover_required: input.annual_turnover_required,
    turnover_pct: toNumeric(input.turnover_pct),
    financial_year_end_month: toInt(input.financial_year_end_month),
    financial_year_end_day: toInt(input.financial_year_end_day),
    turnover_penalty_clause: input.turnover_penalty_clause || null,
    turnover_penalty_amount: toNumeric(input.turnover_penalty_amount),
  };
}

export async function createTenant(input: TenantInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.rpc("create_tenant_with_lease", {
    tenant_data: { ...buildTenantIdentityPayload(input), created_by: user.id, updated_by: user.id },
    lease_data: { ...buildLeasePayload(input), created_by: user.id, updated_by: user.id },
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

  const { error: tenantError } = await supabase
    .from("tenants")
    .update({
      ...buildTenantIdentityPayload(input),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (tenantError) return { error: tenantError.message };

  // Editing tenant details updates the CURRENT lease in place - this is a
  // correction, not a renewal, so it must not create a new history row.
  // Renewals go through renewLease() instead.
  const { data: currentLease } = await supabase
    .from("leases")
    .select("id")
    .eq("tenant_id", id)
    .eq("status", "active")
    .maybeSingle();

  const leasePayload = {
    ...buildLeasePayload(input),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  if (currentLease) {
    const { error: leaseError } = await supabase.from("leases").update(leasePayload).eq("id", currentLease.id);
    if (leaseError) return { error: leaseError.message };
  } else {
    // Defensive: every tenant should have a current lease, but if one is
    // somehow missing, create it rather than silently dropping the data.
    const { error: leaseError } = await supabase
      .from("leases")
      .insert({ ...leasePayload, tenant_id: id, created_by: user.id });
    if (leaseError) return { error: leaseError.message };
  }

  revalidatePath("/dashboard/tenants");
  revalidatePath(`/dashboard/tenants/${id}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export type RenewLeaseInput = {
  lease_start: string;
  lease_end: string;
  option_period: string;
  monthly_rental: string;
  escalation_pct: string;
  escalation_date: string;
};

export async function renewLease(tenantId: string, buildingId: string, input: RenewLeaseInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();

  // Carry forward the outgoing lease's other terms (shop, security,
  // compliance, turnover obligations) - a renewal is a new occupancy term,
  // not a reset of everything else about the tenancy.
  const { data: outgoing } = await supabase
    .from("leases")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .maybeSingle();

  const { error } = await supabase.from("leases").insert({
    tenant_id: tenantId,
    building_id: buildingId,
    shop_number: outgoing?.shop_number ?? null,
    gla: outgoing?.gla ?? null,
    lease_start: toDate(input.lease_start),
    lease_end: toDate(input.lease_end),
    option_period: input.option_period || null,
    base_rental: toNumeric(input.monthly_rental),
    escalation_pct: toNumeric(input.escalation_pct),
    escalation_date: toDate(input.escalation_date),
    operating_costs: outgoing?.operating_costs ?? null,
    rates: outgoing?.rates ?? null,
    marketing_charge: outgoing?.marketing_charge ?? null,
    other_charges: outgoing?.other_charges ?? null,
    deposit_amount: outgoing?.deposit_amount ?? null,
    deposit_type: outgoing?.deposit_type ?? null,
    bank_guarantee_reference: outgoing?.bank_guarantee_reference ?? null,
    surety_name: outgoing?.surety_name ?? null,
    surety_expiry: outgoing?.surety_expiry ?? null,
    security_notes: outgoing?.security_notes ?? null,
    fica_status: outgoing?.fica_status ?? null,
    insurance_status: outgoing?.insurance_status ?? null,
    lease_signed: outgoing?.lease_signed ?? false,
    deposit_received: outgoing?.deposit_received ?? false,
    guarantee_received: outgoing?.guarantee_received ?? false,
    surety_received: outgoing?.surety_received ?? false,
    turnover_reporting_required: outgoing?.turnover_reporting_required ?? false,
    monthly_turnover_required: outgoing?.monthly_turnover_required ?? false,
    annual_turnover_required: outgoing?.annual_turnover_required ?? false,
    turnover_pct: outgoing?.turnover_pct ?? null,
    financial_year_end_month: outgoing?.financial_year_end_month ?? null,
    financial_year_end_day: outgoing?.financial_year_end_day ?? null,
    turnover_penalty_clause: outgoing?.turnover_penalty_clause ?? null,
    turnover_penalty_amount: outgoing?.turnover_penalty_amount ?? null,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  revalidatePath("/dashboard/tenants");
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

export async function getTenantImportMatchingData() {
  const supabase = createClient() as any;
  const [{ data: buildings }, { data: tenants }] = await Promise.all([
    supabase.from("buildings").select("id, building_code").is("archived_at", null),
    supabase.from("tenants").select("id, building_id, account_number, shop_number, trading_name").is("archived_at", null),
  ]);
  return {
    buildings: (buildings ?? []) as { id: string; building_code: string | null }[],
    tenants: (tenants ?? []) as { id: string; building_id: string; account_number: string | null; shop_number: string | null; trading_name: string }[],
  };
}

export async function commitTenantImport(rows: ImportPreviewRow<TenantImportData>[], filename: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", created: 0, updated: 0, rejected: rows.length };

  const validRows = rows.filter((row) => row.errors.length === 0);
  const batchResult = await createImportBatch({
    module: "tenants",
    filename,
    templateVersion: "VOREXA-TENANTS-v2",
    portfolioId: null,
    rows,
  });
  if (batchResult.error || !batchResult.batchId) {
    return { error: batchResult.error, created: 0, updated: 0, rejected: rows.length };
  }

  const supabase = createClient() as any;
  let created = 0;
  let updated = 0;

  for (const row of validRows) {
    const input: TenantInput = {
      building_id: row.data.buildingId,
      trading_name: row.data.tradingName,
      registered_entity: row.data.registeredEntity,
      account_number: row.data.accountNumber,
      shop_number: row.data.shopNumber,
      gla: row.data.gla,
      status: row.data.status,
      monthly_rental: row.data.monthlyRental,
      lease_start: row.data.leaseStart,
      lease_end: row.data.leaseEnd,
      option_period: row.data.optionPeriod,
      escalation_pct: row.data.escalationPct,
      escalation_date: row.data.escalationDate,
      operating_costs: row.data.operatingCosts,
      rates: row.data.rates,
      marketing_charge: row.data.marketingCharge,
      other_charges: row.data.otherCharges,
      deposit_amount: row.data.depositAmount,
      deposit_type: row.data.depositType,
      bank_guarantee_reference: row.data.bankGuaranteeReference,
      surety_name: row.data.suretyName,
      surety_expiry: row.data.suretyExpiry,
      security_notes: "",
      fica_status: row.data.ficaStatus,
      insurance_status: row.data.insuranceStatus,
      lease_signed: row.data.leaseSigned,
      guarantee_received: row.data.guaranteeReceived,
      deposit_received: row.data.depositReceived,
      surety_received: row.data.suretyReceived,
      turnover_reporting_required: row.data.turnoverReportingRequired,
      monthly_turnover_required: row.data.monthlyTurnoverRequired,
      annual_turnover_required: row.data.annualTurnoverRequired,
      turnover_pct: row.data.turnoverPct,
      financial_year_end_month: row.data.financialYearEndMonth,
      financial_year_end_day: row.data.financialYearEndDay,
      turnover_penalty_clause: row.data.turnoverPenaltyClause,
      turnover_penalty_amount: row.data.turnoverPenaltyAmount,
      notes: row.data.notes,
    };

    const identityPayload = { ...buildTenantIdentityPayload(input), import_source: filename, updated_by: user.id, updated_at: new Date().toISOString() };
    const leasePayload = { ...buildLeasePayload(input), import_source: filename, updated_by: user.id, updated_at: new Date().toISOString() };

    let recordId: string | null | undefined = row.recordId;
    let previous: any = null;
    let rowError: string | null = null;

    if (row.action === "update" && row.recordId) {
      const before = await supabase.from("tenants").select("*, leases(*)").eq("id", row.recordId).single();
      previous = before.data;

      const { error: tenantError } = await supabase.from("tenants").update(identityPayload).eq("id", row.recordId);
      rowError = tenantError?.message ?? null;

      if (!rowError) {
        const { data: currentLease } = await supabase
          .from("leases")
          .select("id")
          .eq("tenant_id", row.recordId)
          .eq("status", "active")
          .maybeSingle();

        const { error: leaseError } = currentLease
          ? await supabase.from("leases").update(leasePayload).eq("id", currentLease.id)
          : await supabase.from("leases").insert({ ...leasePayload, tenant_id: row.recordId, created_by: user.id });
        rowError = leaseError?.message ?? null;
      }
      if (!rowError) updated += 1;
    } else {
      const { data, error } = await supabase.rpc("create_tenant_with_lease", {
        tenant_data: { ...identityPayload, created_by: user.id },
        lease_data: { ...leasePayload, created_by: user.id },
      });
      rowError = error?.message ?? null;
      recordId = data;
      if (!rowError) created += 1;
    }

    await supabase
      .from("import_batch_rows")
      .update({
        status: rowError ? "rejected" : "applied",
        record_table: "tenants",
        record_id: recordId || null,
        previous_data: previous,
        applied_data: rowError ? null : { ...identityPayload, ...leasePayload },
        errors: rowError ? [{ field: "row", value: row.matchKey, reason: rowError }] : row.errors,
      })
      .eq("batch_id", batchResult.batchId)
      .eq("row_number", row.rowNumber);

    if (!rowError && recordId) {
      await supabase.from("audit_log").insert({
        table_name: "tenants",
        record_id: recordId,
        action: row.action === "update" ? "import_update" : "import_create",
        field_changes: { previous, applied: { ...identityPayload, ...leasePayload } },
        import_source: filename,
        import_batch_id: batchResult.batchId,
        performed_by: user.id,
      });
    }
  }

  await finalizeImportBatch(batchResult.batchId, created, updated);
  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
  return { error: null, batchId: batchResult.batchId, created, updated, rejected: rows.length - validRows.length };
}
