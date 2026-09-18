import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { SiteVisitFormButton } from "./SiteVisitForm";
import { getSelectedBuilding } from "@/lib/building";

export default async function SiteVisitsPage({
  searchParams,
}: {
  searchParams: { building_id?: string };
}) {
  const supabase = createClient();
  const selectedBuilding = getSelectedBuilding();
  const buildingId = searchParams.building_id ?? (selectedBuilding !== "all" ? selectedBuilding : undefined);

  let query = supabase
    .from("site_visits")
    .select("id, building_id, visit_date, visit_type, status, buildings(name), site_visit_items(id)")
    .is("archived_at", null)
    .order("visit_date", { ascending: false });

  if (buildingId) query = query.eq("building_id", buildingId);

  const [{ data: visits }, { data: buildings }] = await Promise.all([
    query,
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Site Visits"
        description={`${visits?.length ?? 0} visits logged`}
        action={<SiteVisitFormButton label="+ Log Visit" buildings={buildings ?? []} />}
      />

      {buildingId && (
        <FilterChip
          label={(buildings ?? []).find((b) => b.id === buildingId)?.name ?? "building"}
          clearHref="/dashboard/site-visits"
        />
      )}

      {visits && visits.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Building</th>
                <th>Type</th>
                <th>Date</th>
                <th>Items</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visits.map((v: any) => (
                <tr key={v.id}>
                  <td className="font-medium">
                    <Link href={`/dashboard/site-visits/${v.id}`} className="text-cyan-400 hover:underline">
                      {v.buildings?.name ?? "—"}
                    </Link>
                  </td>
                  <td>{v.visit_type ?? "—"}</td>
                  <td>{formatDate(v.visit_date)}</td>
                  <td>{v.site_visit_items?.length ?? 0}</td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="text-right">
                    <Link href={`/dashboard/site-visits/${v.id}`} className="text-xs text-cyan-400 hover:underline">
                      Open
                    </Link>
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
