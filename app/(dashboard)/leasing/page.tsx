import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/StatusBadge";
import { LEASING_STAGE_CLASSES, enumLabel } from "@/lib/status";
import { formatCurrency } from "@/lib/format";
import { LeasingDealFormButton } from "./LeasingDealForm";

export default async function LeasingPage() {
  const supabase = createClient();
  const portfolio = getSelectedPortfolio();

  const { data: buildings } = await supabase
    .from("buildings")
    .select("id, name, portfolio")
    .is("archived_at", null)
    .order("name");

  const scopedIds =
    portfolio === "all" ? null : (buildings ?? []).filter((b) => b.portfolio === portfolio).map((b) => b.id);

  let query = supabase
    .from("leasing_deals")
    .select("id, prospect_name, shop_number, stage, deal_value, building_id, tenant_id, buildings(name), tenants(trading_name)")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (scopedIds) query = query.in("building_id", scopedIds);

  const [{ data: deals }, { data: tenants }] = await Promise.all([
    query,
    supabase.from("tenants").select("id, trading_name").is("archived_at", null).order("trading_name"),
  ]);

  const buildingOptions = buildings ?? [];
  const tenantOptions = tenants ?? [];

  return (
    <div>
      <PageHeader
        title="Leasing"
        description={`${deals?.length ?? 0} deals`}
        action={
          <LeasingDealFormButton label="+ Add Deal" buildings={buildingOptions} tenants={tenantOptions} />
        }
      />

      {deals && deals.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Prospect / Tenant</th>
                <th>Building</th>
                <th>Shop</th>
                <th>Stage</th>
                <th>Deal Value</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {deals.map((d: any) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.tenants?.trading_name ?? d.prospect_name ?? "—"}</td>
                  <td>{d.buildings?.name ?? "—"}</td>
                  <td>{d.shop_number ?? "—"}</td>
                  <td>
                    <Badge
                      label={enumLabel(d.stage)}
                      className={LEASING_STAGE_CLASSES[d.stage] ?? "bg-charcoal-600/60 text-charcoal-200"}
                    />
                  </td>
                  <td>{formatCurrency(d.deal_value)}</td>
                  <td className="text-right">
                    <LeasingDealFormButton
                      deal={d}
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
        <EmptyState title="No leasing deals yet" />
      )}
    </div>
  );
}
