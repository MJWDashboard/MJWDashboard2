import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { SiteVisitFormButton } from "./SiteVisitForm";

export default async function SiteVisitsPage() {
  const supabase = createClient();

  const [{ data: visits }, { data: buildings }] = await Promise.all([
    supabase
      .from("site_visits")
      .select("id, building_id, visit_date, observations, risks, status, buildings(name)")
      .is("archived_at", null)
      .order("visit_date", { ascending: false }),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Site Visits"
        description={`${visits?.length ?? 0} visits logged`}
        action={<SiteVisitFormButton label="+ Log Visit" buildings={buildings ?? []} />}
      />

      {visits && visits.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Building</th>
                <th>Date</th>
                <th>Observations</th>
                <th>Risks</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visits.map((v: any) => (
                <tr key={v.id}>
                  <td className="font-medium">{v.buildings?.name ?? "—"}</td>
                  <td>{formatDate(v.visit_date)}</td>
                  <td className="max-w-xs truncate">{v.observations ?? "—"}</td>
                  <td className="max-w-xs truncate">{v.risks ?? "—"}</td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="text-right">
                    <SiteVisitFormButton visit={v} label="Edit" buildings={buildings ?? []} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No site visits logged yet" />
      )}
    </div>
  );
}
