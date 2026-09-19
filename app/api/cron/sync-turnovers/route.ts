import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { fetchSheetRows } from "@/lib/googleSheets";
import { sendEmail, absoluteUrl } from "@/lib/email";
import { parseTurnoverImportRows, isMeaningfulChange } from "@/app/dashboard/turnovers/importUtils";

export const dynamic = "force-dynamic";

// Fires on a schedule (see vercel.json). Reads the "01. Turnover Workings"
// Google Sheet and stages any new/changed rows as a "preview" import batch -
// exactly the same shape the manual Turnovers importer creates - for a human
// to review and confirm from the dashboard. This route never writes to the
// live turnovers table itself.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetId = process.env.TURNOVER_SYNC_SHEET_ID;
  const organizationId = process.env.SHEET_SYNC_ORGANIZATION_ID;
  const systemUserId = process.env.SHEET_SYNC_SYSTEM_USER_ID;
  if (!sheetId || !organizationId || !systemUserId) {
    return NextResponse.json(
      { error: "TURNOVER_SYNC_SHEET_ID / SHEET_SYNC_ORGANIZATION_ID / SHEET_SYNC_SYSTEM_USER_ID are not configured." },
      { status: 500 }
    );
  }

  const supabase = createServiceRoleClient();

  const [sheetRows, { data: buildings }, { data: tenants }, { data: turnovers }] = await Promise.all([
    fetchSheetRows(sheetId, "A:L"),
    supabase.from("buildings").select("id, building_code, name").is("archived_at", null),
    supabase
      .from("tenants")
      .select(
        "id, building_id, account_number, trading_name, shop_number, turnover_pct, turnover_penalty_clause, turnover_penalty_amount, monthly_turnover_required"
      )
      .is("archived_at", null),
    supabase
      .from("turnovers")
      .select("id, tenant_id, period, turnover_amount, turnover_rental, submitted, submitted_at, penalty_applicable, penalty_amount, notes")
      .is("archived_at", null),
  ]);

  const parsed = parseTurnoverImportRows(sheetRows, buildings ?? [], tenants ?? [], (turnovers ?? []) as any);

  // Don't restage anything already sitting in an unconfirmed batch from a previous run.
  const { data: pendingBatches } = await supabase
    .from("import_batches")
    .select("id")
    .eq("module", "turnovers")
    .eq("status", "preview");
  const pendingBatchIds = (pendingBatches ?? []).map((b) => b.id);
  let alreadyPendingKeys = new Set<string>();
  if (pendingBatchIds.length) {
    const { data: pendingRows } = await supabase
      .from("import_batch_rows")
      .select("match_key")
      .in("batch_id", pendingBatchIds)
      .eq("status", "pending");
    alreadyPendingKeys = new Set((pendingRows ?? []).map((r) => r.match_key).filter((key): key is string => Boolean(key)));
  }

  const existingByTenantPeriod = new Map((turnovers ?? []).map((t: any) => [`${t.tenant_id}:${t.period.slice(0, 7)}`, t]));

  const rowsToStage = parsed.filter((row) => {
    if (row.errors.length) return false;
    if (alreadyPendingKeys.has(row.matchKey)) return false;
    const existing = row.data.tenantId ? existingByTenantPeriod.get(`${row.data.tenantId}:${row.data.period}`) : undefined;
    return isMeaningfulChange(row, existing);
  });

  if (!rowsToStage.length) {
    return NextResponse.json({ staged: 0, message: "No new or changed rows since the last sync." });
  }

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      organization_id: organizationId,
      module: "turnovers",
      filename: "Turnover Workings (Google Sheet sync)",
      template_version: "VOREXA-TURNOVERS-v1",
      rows_submitted: rowsToStage.length,
      rows_rejected: 0,
      rows_warning: rowsToStage.filter((r) => r.warnings.length).length,
      created_by: systemUserId,
      metadata: { source: "google-sheet-sync", sheet_id: sheetId },
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: batchError?.message ?? "Could not create batch." }, { status: 500 });
  }

  await supabase.from("import_batch_rows").insert(
    rowsToStage.map((row) => ({
      batch_id: batch.id,
      row_number: row.rowNumber,
      action: row.action,
      status: "pending",
      record_id: row.recordId || null,
      match_key: row.matchKey,
      supplied_data: row.data,
      errors: [],
      warnings: row.warnings,
    }))
  );

  const { data: userResult } = await supabase.auth.admin.getUserById(systemUserId);
  const notifyEmail = userResult?.user?.email;
  if (notifyEmail) {
    await sendEmail({
      to: notifyEmail,
      subject: `${rowsToStage.length} turnover row${rowsToStage.length === 1 ? "" : "s"} ready for review`,
      html: `<p>Your Turnover Workings sheet has ${rowsToStage.length} new or changed row${rowsToStage.length === 1 ? "" : "s"} ready to review.</p><p><a href="${absoluteUrl("/dashboard/turnovers")}">Open Turnovers</a> to confirm them.</p>`,
    });
  }

  return NextResponse.json({ staged: rowsToStage.length, batchId: batch.id });
}
