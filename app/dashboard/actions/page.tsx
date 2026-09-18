import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { StatusBadge, Badge } from "@/components/StatusBadge";
import { PRIORITY_CLASSES, enumLabel } from "@/lib/status";
import { formatDate } from "@/lib/format";
import { ActionItemFormButton } from "./ActionItemForm";
import { getSelectedBuilding } from "@/lib/building";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: { building_id?: string; tenant_id?: string };
}) {
  const supabase = createClient();
  const selectedBuilding = getSelectedBuilding();
  const buildingId = searchParams.building_id ?? (selectedBuilding !== "all" ? selectedBuilding : undefined);
  const tenantId = searchParams.tenant_id;

  let query = supabase
    .from("action_items")
    .select(
      "id, title, description, building_id, tenant_id, meeting_id, priority, status, due_date, risk, buildings(name), tenants(trading_name), meetings(title)"
    )
    .is("archived_at", null)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (buildingId) query = query.eq("building_id", buildingId);
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const [{ data: items }, { data: buildings }, { data: tenants }] = await Promise.all([
    query,
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase.from("tenants").select("id, trading_name").is("archived_at", null).order("trading_name"),
  ]);

  const buildingOptions = buildings ?? [];
  const tenantOptions = tenants ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (a: any) => a.status !== "complete" && a.due_date && a.due_date < today;
  const filterLabel =
    (tenantId && tenantOptions.find((t) => t.id === tenantId)?.trading_name) ||
    (buildingId && buildingOptions.find((b) => b.id === buildingId)?.name);

  return (
    <div>
      <PageHeader
        title="Actions"
        description={`${items?.length ?? 0} action items`}
        action={<ActionItemFormButton label="+ Add Action" buildings={buildingOptions} tenants={tenantOptions} />}
      />

      {filterLabel && <FilterChip label={filterLabel} clearHref="/dashboard/actions" />}

      {items && items.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Title</th>
                <th>Building / Tenant</th>
                <th>Priority</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((a: any) => (
                <tr key={a.id}>
                  <td className="font-medium">
                    {a.title}
                    {a.risk && (
                      <Badge label="Risk" className="ml-2 bg-red-500/20 text-red-400" />
                    )}
                    {a.meeting_id && (
                      <Link
                        href={`/dashboard/meetings/${a.meeting_id}`}
                        className="ml-2 text-xs text-charcoal-400 hover:underline"
                      >
                        via {a.meetings?.title ?? "meeting"}
                      </Link>
                    )}
                  </td>
                  <td>
                    {a.tenant_id ? (
                      <Link href={`/dashboard/tenants/${a.tenant_id}`} className="text-cyan-400 hover:underline">
                        {a.tenants?.trading_name ?? "—"}
                      </Link>
                    ) : a.building_id ? (
                      <Link href={`/dashboard/buildings/${a.building_id}`} className="text-cyan-400 hover:underline">
                        {a.buildings?.name ?? "—"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Badge
                      label={enumLabel(a.priority)}
                      className={PRIORITY_CLASSES[a.priority] ?? "bg-charcoal-600/60 text-charcoal-200"}
                    />
                  </td>
                  <td>
                    {formatDate(a.due_date)}
                    {isOverdue(a) && (
                      <Badge label="Overdue" className="ml-2 bg-red-500/20 text-red-400" />
                    )}
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="text-right">
                    <ActionItemFormButton
                      item={a}
                      label="Edit"
                      buildings={buildingOptions}
                      tenants={tenantOptions}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No action items yet" />
      )}
    </div>
  );
}
