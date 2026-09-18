import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge, Badge } from "@/components/StatusBadge";
import { PRIORITY_CLASSES, enumLabel } from "@/lib/status";
import { formatDate } from "@/lib/format";
import { ActionItemFormButton } from "./ActionItemForm";

export default async function ActionsPage() {
  const supabase = createClient();

  const [{ data: items }, { data: buildings }, { data: tenants }] = await Promise.all([
    supabase
      .from("action_items")
      .select("id, title, description, building_id, tenant_id, priority, status, due_date, risk, buildings(name), tenants(trading_name)")
      .is("archived_at", null)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase.from("tenants").select("id, trading_name").is("archived_at", null).order("trading_name"),
  ]);

  const buildingOptions = buildings ?? [];
  const tenantOptions = tenants ?? [];

  return (
    <div>
      <PageHeader
        title="Actions"
        description={`${items?.length ?? 0} action items`}
        action={<ActionItemFormButton label="+ Add Action" buildings={buildingOptions} tenants={tenantOptions} />}
      />

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
                  </td>
                  <td>{a.tenants?.trading_name ?? a.buildings?.name ?? "—"}</td>
                  <td>
                    <Badge
                      label={enumLabel(a.priority)}
                      className={PRIORITY_CLASSES[a.priority] ?? "bg-charcoal-600/60 text-charcoal-200"}
                    />
                  </td>
                  <td>{formatDate(a.due_date)}</td>
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
