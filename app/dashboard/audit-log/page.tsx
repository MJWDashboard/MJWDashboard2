import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { isPlatformAdmin } from "@/lib/supabase/platformAdmin";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/StatusBadge";
import { FilterChip } from "@/components/FilterChip";
import { formatDateTime } from "@/lib/format";
import { AuditRow } from "./AuditRow";
import { ImportBatchRow } from "./ImportBatchRow";

const ACTION_CLASSES: Record<string, string> = {
  insert: "bg-green-500/20 text-green-400",
  update: "bg-cyan-600/20 text-cyan-400",
  delete: "bg-red-500/20 text-red-400",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { table?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");

  const supabase = createClient();
  const isAdmin = await isPlatformAdmin(supabase, user.id);
  const isOrgAdmin = user.role === "admin";

  if (!isAdmin && !isOrgAdmin) redirect("/dashboard");

  let query = supabase
    .from("audit_log")
    .select("id, table_name, record_id, action, performed_by, field_changes, performed_at")
    .order("performed_at", { ascending: false })
    .limit(300);

  if (searchParams.table) query = query.eq("table_name", searchParams.table);

  const [{ data: entries }, { data: emailRows }, { data: importBatches }] = await Promise.all([
    query,
    supabase.rpc("org_member_emails"),
    (supabase as any).from("import_batches").select("id, module, filename, status, rows_submitted, rows_created, rows_updated, rows_rejected, created_at").order("created_at", { ascending: false }).limit(100),
  ]);

  const emailByUserId = new Map((emailRows ?? []).map((r: any) => [r.user_id, r.email]));
  const tables = Array.from(new Set((entries ?? []).map((e) => e.table_name))).sort();

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description={
          isAdmin
            ? "Every tracked change across the platform, for accountability"
            : "Every tracked change made by your team, for accountability"
        }
      />

      {searchParams.table && <FilterChip label={searchParams.table} clearHref="/dashboard/audit-log" />}

      {!searchParams.table && importBatches && importBatches.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-charcoal-100">Import Batches</h2>
          <div className="table-shell"><table className="table-base"><thead><tr><th>Uploaded</th><th>Module</th><th>File</th><th>Batch ID</th><th>Created / Updated / Rejected</th><th>Status</th><th /></tr></thead><tbody>{importBatches.map((batch: any) => <ImportBatchRow key={batch.id} batch={batch}/>)}</tbody></table></div>
        </div>
      )}

      {!searchParams.table && tables.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {tables.map((t) => (
            <a
              key={t}
              href={`/dashboard/audit-log?table=${t}`}
              className="rounded-full border border-charcoal-700 px-3 py-1 text-xs text-charcoal-300 hover:border-cyan-500/50 hover:text-cyan-400"
            >
              {t}
            </a>
          ))}
        </div>
      )}

      {entries && entries.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Table</th>
                <th>Record</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map((e: any) => (
                <AuditRow
                  key={e.id}
                  when={formatDateTime(e.performed_at)}
                  who={emailByUserId.get(e.performed_by) ?? e.performed_by ?? "System"}
                  action={<Badge label={e.action} className={`capitalize ${ACTION_CLASSES[e.action] ?? ""}`} />}
                  tableName={e.table_name}
                  recordId={e.record_id}
                  fieldChanges={e.field_changes}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No tracked changes yet" />
      )}
    </div>
  );
}
