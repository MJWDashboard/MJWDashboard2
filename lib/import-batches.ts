"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import type { ImportPreviewRow } from "@/lib/imports";

export async function createImportBatch<T>({ module, filename, templateVersion, portfolioId, rows }: {
  module: string; filename: string; templateVersion: string; portfolioId?: string | null; rows: ImportPreviewRow<T>[];
}) {
  const user = await getCurrentUser();
  if (!user) return { batchId: null, error: "Not authorized." };
  const supabase = createClient() as any;
  const rejected = rows.filter((row) => row.errors.length > 0).length;
  const warnings = rows.filter((row) => row.warnings.length > 0).length;
  const { data: batch, error } = await supabase.from("import_batches").insert({
    organization_id: user.organizationId, portfolio_id: portfolioId || null, module, filename,
    template_version: templateVersion, rows_submitted: rows.length, rows_rejected: rejected,
    rows_warning: warnings, created_by: user.id,
  }).select("id").single();
  if (error || !batch) return { batchId: null, error: error?.message ?? "Could not create import batch." };
  const { error: rowError } = await supabase.from("import_batch_rows").insert(rows.map((row) => ({
    batch_id: batch.id, row_number: row.rowNumber, action: row.errors.length ? "reject" : row.action,
    status: row.errors.length ? "rejected" : "pending", record_id: row.recordId || null,
    match_key: row.matchKey, supplied_data: row.data, errors: row.errors, warnings: row.warnings,
  })));
  if (rowError) return { batchId: batch.id, error: rowError.message };
  return { batchId: batch.id as string, error: null };
}

export async function finalizeImportBatch(batchId: string, created: number, updated: number) {
  const supabase = createClient() as any;
  const { error } = await supabase.from("import_batches").update({
    status: "committed", rows_created: created, rows_updated: updated, committed_at: new Date().toISOString(),
  }).eq("id", batchId);
  return { error: error?.message ?? null };
}
