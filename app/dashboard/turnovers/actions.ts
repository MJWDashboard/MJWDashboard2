"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { computeMonthlyDueDate, computeAnnualDueDate, currentFinancialYear } from "@/lib/turnovers";
import { createImportBatch, finalizeImportBatch } from "@/lib/import-batches";
import type { ImportPreviewRow } from "@/lib/imports";

export type TurnoverInput = {
  tenant_id: string;
  building_id: string;
  unit: string;
  period: string;
  turnover_amount: string;
  turnover_rental: string;
  submitted: boolean;
  penalty_applicable: boolean;
  penalty_amount: string;
  penalty_status: string;
  notes: string;
};

function toNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildPayload(input: TurnoverInput) {
  return {
    tenant_id: input.tenant_id,
    building_id: input.building_id,
    unit: input.unit || null,
    period: input.period,
    due_date: computeMonthlyDueDate(input.period),
    turnover_amount: toNumeric(input.turnover_amount),
    turnover_rental: toNumeric(input.turnover_rental),
    submitted: input.submitted,
    submitted_at: input.submitted ? new Date().toISOString() : null,
    status: input.submitted ? "submitted" : "outstanding",
    penalty_applicable: input.penalty_applicable,
    penalty_amount: toNumeric(input.penalty_amount),
    penalty_status: input.penalty_status || null,
    notes: input.notes || null,
  };
}

export async function createTurnover(input: TurnoverInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("turnovers").insert({
    ...buildPayload(input),
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
      ...buildPayload(input),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnovers");
  return { error: null };
}

export type TurnoverImportData = {
  buildingId: string; tenantId: string; buildingCode: string; accountNumber: string; tradingName: string;
  shopNumber: string; period: string; turnoverAmount: number | null; turnoverRental: number | null;
  submitted: boolean; submissionDate: string | null; penaltyApplicable: boolean; penaltyAmount: number | null; notes: string;
};

export async function getTurnoverImportMatchingData() {
  const supabase = createClient() as any;
  const [{ data: buildings }, { data: tenants }, { data: turnovers }] = await Promise.all([
    supabase.from("buildings").select("id, building_code, name").is("archived_at", null),
    supabase.from("tenants").select("id, building_id, account_number, trading_name, shop_number, turnover_pct, turnover_penalty_clause, turnover_penalty_amount, monthly_turnover_required").is("archived_at", null),
    supabase.from("turnovers").select("id, tenant_id, period, turnover_amount, turnover_rental, submitted, submitted_at, penalty_applicable, penalty_amount, notes").is("archived_at", null),
  ]);
  return {
    buildings: (buildings ?? []) as { id: string; building_code: string | null; name: string }[],
    tenants: (tenants ?? []) as { id: string; building_id: string; account_number: string | null; trading_name: string; shop_number: string | null; turnover_pct: number | null; turnover_penalty_clause: string | null; turnover_penalty_amount: number | null; monthly_turnover_required: boolean }[],
    turnovers: (turnovers ?? []) as { id: string; tenant_id: string; period: string; turnover_amount: number | null; turnover_rental: number | null; submitted: boolean; submitted_at: string | null; penalty_applicable: boolean; penalty_amount: number | null; notes: string | null }[],
  };
}

// Shared by the manual importer commit and by confirming a batch that a
// background sheet-sync staged earlier - both just need to apply already
// validated rows against a batch that already exists.
export async function applyTurnoverBatchRows(
  batchId: string,
  rows: ImportPreviewRow<TurnoverImportData>[],
  userId: string,
  filename: string,
  supabase: any
) {
  const valid = rows.filter((row) => !row.errors.length && row.action !== "skip");
  let created = 0;
  let updated = 0;
  for (const row of valid) {
    const payload = {
      tenant_id: row.data.tenantId, building_id: row.data.buildingId, unit: row.data.shopNumber || null,
      period: `${row.data.period}-01`, due_date: computeMonthlyDueDate(`${row.data.period}-01`),
      turnover_amount: row.data.turnoverAmount, turnover_rental: row.data.turnoverRental,
      submitted: row.data.submitted, submitted_at: row.data.submissionDate,
      status: row.data.submitted ? "submitted" : "outstanding", penalty_applicable: row.data.penaltyApplicable,
      penalty_amount: row.data.penaltyAmount, notes: row.data.notes || null, import_source: `batch:${batchId}`,
      updated_by: userId, updated_at: new Date().toISOString(),
    };
    let recordId = row.recordId; let previous: any = null; let error: any = null;
    if (row.action === "update" && recordId) {
      const before = await supabase.from("turnovers").select("*").eq("id", recordId).single(); previous = before.data;
      ({ error } = await supabase.from("turnovers").update(payload).eq("id", recordId)); if (!error) updated += 1;
    } else {
      const inserted = await supabase.from("turnovers").insert({ ...payload, created_by: userId }).select("id").single();
      error = inserted.error; recordId = inserted.data?.id; if (!error) created += 1;
    }
    await supabase.from("import_batch_rows").update({ status: error ? "rejected" : "applied", record_table: "turnovers", record_id: recordId || null, previous_data: previous, applied_data: error ? null : payload, errors: error ? [{ field: "row", value: row.matchKey, reason: error.message }] : [] }).eq("batch_id", batchId).eq("row_number", row.rowNumber);
    if (!error && recordId) await supabase.from("audit_log").insert({ table_name: "turnovers", record_id: recordId, action: row.action === "update" ? "import_update" : "import_create", field_changes: { previous, applied: payload }, import_source: filename, import_batch_id: batchId, performed_by: userId });
  }
  return { created, updated };
}

export async function commitTurnoverImport(rows: ImportPreviewRow<TurnoverImportData>[], filename: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", created: 0, updated: 0, rejected: rows.length };
  const valid = rows.filter((row) => !row.errors.length && row.action !== "skip");
  const batch = await createImportBatch({ module: "turnovers", filename, templateVersion: "VOREXA-TURNOVERS-v1", rows });
  if (batch.error || !batch.batchId) return { error: batch.error, created: 0, updated: 0, rejected: rows.length };
  const supabase = createClient() as any;
  const { created, updated } = await applyTurnoverBatchRows(batch.batchId, rows, user.id, filename, supabase);
  await finalizeImportBatch(batch.batchId, created, updated); revalidatePath("/dashboard/turnovers"); revalidatePath("/dashboard");
  return { error: null, batchId: batch.batchId, created, updated, rejected: rows.length - valid.length };
}

// ---------- Sheet-sync pending batches ----------

export type PendingTurnoverBatchRow = {
  id: string;
  row_number: number;
  action: string;
  match_key: string;
  supplied_data: TurnoverImportData;
  warnings: { field: string; value: string; reason: string }[];
};

export type PendingTurnoverBatch = {
  id: string;
  filename: string;
  created_at: string;
  rows_submitted: number;
  rows_rejected: number;
  rows: PendingTurnoverBatchRow[];
};

export async function getPendingTurnoverBatches(): Promise<{ batches: PendingTurnoverBatch[] }> {
  const user = await getCurrentUser();
  if (!user) return { batches: [] };
  const supabase = createClient() as any;
  const { data: batches } = await supabase
    .from("import_batches")
    .select("id, filename, created_at, rows_submitted, rows_rejected")
    .eq("module", "turnovers")
    .eq("status", "preview")
    .order("created_at", { ascending: false });
  if (!batches?.length) return { batches: [] };
  const batchIds = batches.map((b: any) => b.id);
  const { data: rows } = await supabase
    .from("import_batch_rows")
    .select("id, batch_id, row_number, action, status, match_key, supplied_data, warnings")
    .in("batch_id", batchIds)
    .eq("status", "pending")
    .order("row_number");
  return {
    batches: batches.map((b: any) => ({
      ...b,
      rows: (rows ?? []).filter((r: any) => r.batch_id === b.id),
    })),
  };
}

export async function confirmTurnoverBatch(batchId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };
  const supabase = createClient() as any;
  const { data: batch } = await supabase.from("import_batches").select("id, status, filename").eq("id", batchId).single();
  if (!batch || batch.status !== "preview") return { error: "Batch not found or already processed." };
  const { data: batchRows } = await supabase
    .from("import_batch_rows")
    .select("row_number, action, match_key, record_id, supplied_data")
    .eq("batch_id", batchId)
    .eq("status", "pending")
    .order("row_number");
  const rows: ImportPreviewRow<TurnoverImportData>[] = (batchRows ?? []).map((r: any) => ({
    rowNumber: r.row_number,
    action: r.action,
    matchKey: r.match_key,
    data: r.supplied_data as TurnoverImportData,
    recordId: r.record_id ?? undefined,
    errors: [],
    warnings: [],
  }));
  const { created, updated } = await applyTurnoverBatchRows(batchId, rows, user.id, batch.filename, supabase);
  await finalizeImportBatch(batchId, created, updated);
  revalidatePath("/dashboard/turnovers");
  revalidatePath("/dashboard");
  return { error: null, created, updated };
}

export async function markCertificateReceived(id: string, received: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("turnover_annual_certificates")
    .update({
      received_at: received ? new Date().toISOString().slice(0, 10) : null,
      status: received ? "received" : "outstanding",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnovers");
  return { error: null };
}

/**
 * Ensures every tenant with annual_turnover_required has a
 * turnover_annual_certificates row for the financial year that most
 * recently closed. Safe to call repeatedly - skips tenants that already
 * have a row for that year.
 */
export async function syncAnnualCertificates() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", created: 0 };

  const supabase = createClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, building_id, financial_year_end_month, financial_year_end_day")
    .eq("annual_turnover_required", true)
    .is("archived_at", null)
    .not("financial_year_end_month", "is", null)
    .not("financial_year_end_day", "is", null);

  let created = 0;

  for (const t of tenants ?? []) {
    const fy = currentFinancialYear(t.financial_year_end_month!, t.financial_year_end_day!);
    const dueDate = computeAnnualDueDate(t.financial_year_end_month!, t.financial_year_end_day!, fy);

    const { error } = await supabase
      .from("turnover_annual_certificates")
      .insert({
        tenant_id: t.id,
        building_id: t.building_id,
        financial_year: fy,
        due_date: dueDate,
        created_by: user.id,
      })
      .select("id")
      .single();

    // Unique (tenant_id, financial_year) - a conflict just means it already exists.
    if (!error) created += 1;
  }

  revalidatePath("/dashboard/turnovers");
  return { error: null, created };
}
