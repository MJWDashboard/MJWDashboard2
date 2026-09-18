"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { REVERSIBLE_IMPORT_MODULES } from "@/lib/import-modules";

const SUPPORTED_TABLES = new Set(["buildings", "turnovers", "contacts", "contractors"]);

export async function reverseImportBatch(batchId: string) {
  const user = await getCurrentUser();
  if (!user || !["admin", "system_administrator", "portfolio_administrator"].includes(user.role)) {
    return { error: "Administrator access is required." };
  }
  const supabase = createClient() as any;
  const { data: batch, error: batchError } = await supabase.from("import_batches").select("id, status, module").eq("id", batchId).single();
  if (batchError || !batch) return { error: batchError?.message ?? "Import batch not found." };
  if (batch.status !== "committed") return { error: "Only a committed batch can be reversed." };
  if (!REVERSIBLE_IMPORT_MODULES.has(batch.module)) {
    return { error: `Reversal isn't supported for ${batch.module} imports yet.` };
  }
  const { data: rows, error: rowError } = await supabase.from("import_batch_rows").select("*").eq("batch_id", batchId).eq("status", "applied").order("row_number", { ascending: false });
  if (rowError) return { error: rowError.message };

  for (const row of rows ?? []) {
    if (!row.record_id || !row.record_table || !SUPPORTED_TABLES.has(row.record_table)) continue;
    const { data: current } = await supabase.from(row.record_table).select("updated_at").eq("id", row.record_id).single();
    if (row.applied_data?.updated_at && current?.updated_at !== row.applied_data.updated_at) {
      return { error: `Rollback stopped: ${row.record_table} row ${row.row_number} was edited after this import.` };
    }
    let error: any = null;
    if (row.action === "create") {
      ({ error } = await supabase.from(row.record_table).update({ archived_at: new Date().toISOString(), updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", row.record_id));
    } else if (row.action === "update" && row.previous_data) {
      const { id: _id, ...previous } = row.previous_data;
      ({ error } = await supabase.from(row.record_table).update({ ...previous, updated_by: user.id, updated_at: new Date().toISOString() }).eq("id", row.record_id));
    }
    if (error) return { error: `Row ${row.row_number}: ${error.message}` };
    await supabase.from("import_batch_rows").update({ status: "reversed" }).eq("id", row.id);
    await supabase.from("audit_log").insert({ table_name: row.record_table, record_id: row.record_id, action: "import_reverse", field_changes: { batch_id: batchId, restored: row.previous_data }, import_source: `rollback:${batchId}`, import_batch_id: batchId, performed_by: user.id });
  }
  const { error } = await supabase.from("import_batches").update({ status: "reversed", reversed_at: new Date().toISOString(), reversed_by: user.id }).eq("id", batchId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/audit-log"); revalidatePath("/dashboard/buildings"); revalidatePath("/dashboard/turnovers"); revalidatePath("/dashboard");
  return { error: null };
}
