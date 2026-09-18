import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { formatDate } from "@/lib/format";
import { DocumentUploadButton } from "./DocumentUpload";
import { DocumentLink } from "./DocumentLink";

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { building_id?: string; tenant_id?: string };
}) {
  const supabase = createClient();
  const { building_id: buildingId, tenant_id: tenantId } = searchParams;

  let query = supabase
    .from("documents")
    .select(
      "id, file_name, file_path, file_size, category, uploaded_at, building_id, tenant_id, meeting_id, site_visit_id, buildings(name), tenants(trading_name), meetings(title)"
    )
    .is("archived_at", null)
    .order("uploaded_at", { ascending: false });

  if (buildingId) query = query.eq("building_id", buildingId);
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const [{ data: documents }, { data: buildings }, { data: tenants }] = await Promise.all([
    query,
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase.from("tenants").select("id, trading_name").is("archived_at", null).order("trading_name"),
  ]);

  const filterLabel =
    (tenantId && (tenants ?? []).find((t) => t.id === tenantId)?.trading_name) ||
    (buildingId && (buildings ?? []).find((b) => b.id === buildingId)?.name);

  return (
    <div>
      <PageHeader
        title="Documents"
        description={`${documents?.length ?? 0} documents`}
        action={<DocumentUploadButton buildings={buildings ?? []} tenants={tenants ?? []} />}
      />

      {filterLabel && <FilterChip label={filterLabel} clearHref="/dashboard/documents" />}

      {documents && documents.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>File</th>
                <th>Category</th>
                <th>Building / Tenant</th>
                <th>Source</th>
                <th>Size</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d: any) => (
                <tr key={d.id}>
                  <td className="font-medium">
                    <DocumentLink path={d.file_path} fileName={d.file_name} />
                  </td>
                  <td>{d.category ?? "—"}</td>
                  <td>
                    {d.tenant_id ? (
                      <Link href={`/dashboard/tenants/${d.tenant_id}`} className="text-cyan-400 hover:underline">
                        {d.tenants?.trading_name ?? "—"}
                      </Link>
                    ) : d.building_id ? (
                      <Link href={`/dashboard/buildings/${d.building_id}`} className="text-cyan-400 hover:underline">
                        {d.buildings?.name ?? "—"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {d.meeting_id ? (
                      <Link href={`/dashboard/meetings/${d.meeting_id}`} className="text-xs text-cyan-400 hover:underline">
                        Meeting: {d.meetings?.title ?? "—"}
                      </Link>
                    ) : d.site_visit_id ? (
                      <Link
                        href={`/dashboard/site-visits/${d.site_visit_id}`}
                        className="text-xs text-cyan-400 hover:underline"
                      >
                        Site Visit
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{formatSize(d.file_size)}</td>
                  <td>{formatDate(d.uploaded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No documents uploaded yet" />
      )}
    </div>
  );
}
