import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { TurnoverFormButton } from "./TurnoverForm";

export default async function TurnoversPage() {
  const supabase = createClient();
  const portfolioId = getSelectedPortfolio();

  const { data: buildings } = await supabase
    .from("buildings")
    .select("id, name, portfolio_id")
    .is("archived_at", null);

  const scopedIds =
    portfolioId === "all"
      ? null
      : (buildings ?? []).filter((b) => b.portfolio_id === portfolioId).map((b) => b.id);

  let query = supabase
    .from("turnovers")
    .select("id, tenant_id, building_id, period, turnover_amount, turnover_rental, submitted, notes, tenants(trading_name), buildings(name)")
    .is("archived_at", null)
    .order("period", { ascending: false });

  if (scopedIds) query = query.in("building_id", scopedIds);

  const [{ data: turnovers }, { data: tenants }] = await Promise.all([
    query,
    supabase.from("tenants").select("id, trading_name, building_id").is("archived_at", null).order("trading_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Turnovers"
        description={`${turnovers?.length ?? 0} records`}
        action={<TurnoverFormButton label="+ Add Turnover" tenants={tenants ?? []} />}
      />

      {turnovers && turnovers.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Building</th>
                <th>Period</th>
                <th>Turnover</th>
                <th>Turnover Rental</th>
                <th>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {turnovers.map((t: any) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.tenants?.trading_name ?? "—"}</td>
                  <td>{t.buildings?.name ?? "—"}</td>
                  <td>{formatDate(t.period)}</td>
                  <td>{formatCurrency(t.turnover_amount)}</td>
                  <td>{formatCurrency(t.turnover_rental)}</td>
                  <td>
                    {t.submitted ? (
                      <Badge label="Submitted" className="bg-green-500/20 text-green-400" />
                    ) : (
                      <Badge label="Pending" className="bg-charcoal-600/60 text-charcoal-200" />
                    )}
                  </td>
                  <td className="text-right">
                    <TurnoverFormButton turnover={t} label="Edit" tenants={tenants ?? []} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No turnover records yet" />
      )}
    </div>
  );
}
