import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/format";
import { DocumentUploadButton } from "./DocumentUpload";
import { DocumentLink } from "./DocumentLink";

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const supabase = createClient();

  const [{ data: documents }, { data: buildings }, { data: tenants }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, file_name, file_path, file_size, category, uploaded_at, buildings(name), tenants(trading_name)")
      .is("archived_at", null)
      .order("uploaded_at", { ascending: false }),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase.from("tenants").select("id, trading_name").is("archived_at", null).order("trading_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Documents"
        description={`${documents?.length ?? 0} documents`}
        action={<DocumentUploadButton buildings={buildings ?? []} tenants={tenants ?? []} />}
      />

      {documents && documents.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>File</th>
                <th>Category</th>
                <th>Building / Tenant</th>
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
                  <td>{d.tenants?.trading_name ?? d.buildings?.name ?? "—"}</td>
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
