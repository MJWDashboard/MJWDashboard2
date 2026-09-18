"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { createImportBatch, finalizeImportBatch } from "@/lib/import-batches";
import type { ImportPreviewRow } from "@/lib/imports";

export async function getArrearsComments(arrearsCurrentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("arrears_comments")
    .select("id, comment, follow_up_date, status, promise_to_pay_date, promise_to_pay_amount, escalation, created_at")
    .eq("arrears_current_id", arrearsCurrentId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export type ArrearsCommentInput = {
  arrears_current_id: string;
  tenant_id: string | null;
  building_id: string;
  comment: string;
  follow_up_date: string;
  promise_to_pay_date: string;
  promise_to_pay_amount: string;
  escalation: boolean;
};

export async function addArrearsComment(input: ArrearsCommentInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("arrears_comments").insert({
    arrears_current_id: input.arrears_current_id,
    tenant_id: input.tenant_id,
    building_id: input.building_id,
    comment: input.comment,
    follow_up_date: input.follow_up_date || null,
    promise_to_pay_date: input.promise_to_pay_date || null,
    promise_to_pay_amount: input.promise_to_pay_amount ? Number(input.promise_to_pay_amount) : null,
    escalation: input.escalation,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/arrears");
  return { error: null };
}

export async function updateArrearsStatus(arrearsCurrentId: string, status: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("arrears_current")
    .update({ status: status as any, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", arrearsCurrentId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/arrears");
  return { error: null };
}

export async function linkArrearsToTenant(arrearsCurrentId: string, tenantId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("arrears_current")
    .update({ tenant_id: tenantId, match_status: "matched", updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", arrearsCurrentId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/arrears");
  return { error: null };
}

export async function unlinkArrearsFromTenant(arrearsCurrentId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("arrears_current")
    .update({ tenant_id: null, match_status: "unmatched", updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", arrearsCurrentId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/arrears");
  return { error: null };
}

export type ArrearsRecordInput = {
  building_id: string;
  tenant_id: string;
  debtor_name: string;
  account_number: string;
  current_balance: string;
  days_30: string;
  days_60: string;
  days_90_plus: string;
  status: string;
  risk: boolean;
};

function num(v: string): number {
  const n = Number(v.trim());
  return Number.isNaN(n) ? 0 : n;
}

export async function createArrearsRecord(input: ArrearsRecordInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("arrears_current").insert({
    building_id: input.building_id,
    tenant_id: input.tenant_id || null,
    debtor_name: input.debtor_name || null,
    account_number: input.account_number || null,
    match_status: input.tenant_id ? "matched" : "unmatched",
    current_balance: num(input.current_balance),
    days_30: num(input.days_30),
    days_60: num(input.days_60),
    days_90_plus: num(input.days_90_plus),
    status: input.status as any,
    risk: input.risk,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/arrears");
  return { error: null };
}

export async function updateArrearsRecord(id: string, input: ArrearsRecordInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("arrears_current")
    .update({
      building_id: input.building_id,
      tenant_id: input.tenant_id || null,
      debtor_name: input.debtor_name || null,
      account_number: input.account_number || null,
      match_status: input.tenant_id ? "matched" : "unmatched",
      current_balance: num(input.current_balance),
      days_30: num(input.days_30),
      days_60: num(input.days_60),
      days_90_plus: num(input.days_90_plus),
      status: input.status as any,
      risk: input.risk,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/arrears");
  return { error: null };
}

export async function getArrearsMatchingData() {
  const supabase = createClient();
  const [{ data: current }, { data: tenants }] = await Promise.all([
    supabase.from("arrears_current").select("id, building_id, tenant_id, debtor_name, account_number"),
    supabase.from("tenants").select("id, building_id, trading_name, account_number").is("archived_at", null),
  ]);
  return { current: current ?? [], tenants: tenants ?? [] };
}

export type ArrearsImportRow = {
  existingId: string | null;
  buildingId: string;
  debtorName: string;
  accountNumber: string;
  currentBalance: string;
  days30: string;
  days60: string;
  days90Plus: string;
  asOfMonth: string;
  tenantId: string | null;
  matchStatus: "matched" | "possible" | "unmatched";
};

export async function commitArrearsImport(rows: ArrearsImportRow[], filename: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", imported: 0 };

  const supabase = createClient();
  let imported = 0;
  let created = 0;
  let updated = 0;
  const asOfMonth = rows[0]?.asOfMonth || new Date().toISOString().slice(0, 10);

  const previewRows: ImportPreviewRow<ArrearsImportRow>[] = rows.map((row, i) => ({
    rowNumber: i + 1,
    action: row.existingId ? "update" : "create",
    matchKey: row.accountNumber || row.debtorName,
    data: row,
    recordId: row.existingId,
    errors: [],
    warnings: [],
  }));
  const batchResult = await createImportBatch({
    module: "arrears",
    filename,
    templateVersion: "VOREXA-ARREARS-v1",
    portfolioId: null,
    rows: previewRows,
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const financials = {
      building_id: row.buildingId,
      debtor_name: row.debtorName || null,
      account_number: row.accountNumber || null,
      current_balance: num(row.currentBalance),
      days_30: num(row.days30),
      days_60: num(row.days60),
      days_90_plus: num(row.days90Plus),
      as_of_month: asOfMonth,
      last_imported_at: new Date().toISOString(),
      last_imported_source: "excel_import",
      updated_by: user.id,
    };

    let currentId = row.existingId;
    let previous: any = null;
    let rowError: string | null = null;

    if (currentId) {
      // Financial fields are overwritten on import - notes (arrears_comments)
      // are a separate table keyed off this row's id and are never touched here.
      const before = await supabase.from("arrears_current").select("*").eq("id", currentId).single();
      previous = before.data;
      const { error } = await supabase.from("arrears_current").update(financials).eq("id", currentId);
      rowError = error?.message ?? null;
      if (!rowError) {
        imported += 1;
        updated += 1;
      }
    } else {
      const { data, error } = await supabase
        .from("arrears_current")
        .insert({
          ...financials,
          tenant_id: row.tenantId,
          match_status: row.matchStatus,
        })
        .select("id")
        .single();
      rowError = error?.message ?? null;
      if (!rowError && data) {
        imported += 1;
        created += 1;
        currentId = data.id;
      }
    }

    if (!rowError && currentId) {
      await supabase.from("arrears_history").insert({
        tenant_id: row.tenantId,
        building_id: row.buildingId,
        debtor_name: row.debtorName || null,
        account_number: row.accountNumber || null,
        as_of_month: asOfMonth,
        balance: num(row.currentBalance),
        days_30: num(row.days30),
        days_60: num(row.days60),
        days_90_plus: num(row.days90Plus),
        import_source: "excel_import",
      });
    }

    if (batchResult.batchId) {
      await supabase
        .from("import_batch_rows")
        .update({
          status: rowError ? "rejected" : "applied",
          record_table: "arrears_current",
          record_id: currentId || null,
          previous_data: previous,
          applied_data: rowError ? null : financials,
          errors: rowError ? [{ field: "row", value: row.debtorName, reason: rowError }] : [],
        })
        .eq("batch_id", batchResult.batchId)
        .eq("row_number", rowNumber);
      if (!rowError && currentId) {
        await supabase.from("audit_log").insert({
          table_name: "arrears_current",
          record_id: currentId,
          action: row.existingId ? "import_update" : "import_create",
          field_changes: { previous, applied: financials },
          import_source: filename,
          import_batch_id: batchResult.batchId,
          performed_by: user.id,
        });
      }
    }
  }

  if (batchResult.batchId) {
    await finalizeImportBatch(batchResult.batchId, created, updated);
  }

  revalidatePath("/dashboard/arrears");
  return { error: null, imported, batchId: batchResult.batchId };
}
