import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ExportButton } from "@/components/ExportButton";
import { PdfExportButton } from "@/components/PdfExportButton";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrearsTimelineButton } from "./ArrearsTimeline";

export default async function ArrearsPage() {
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
    .from("arrears_current")
    .select(
      "tenant_id, building_id, current_balance, days_30, days_60, days_90_plus, as_of_month, status, tenants(trading_name), buildings(name)"
    )
    .order("current_balance", { ascending: false });

  if (scopedIds) query = query.in("building_id", scopedIds);

  const { data: arrears } = await query;
  const total = (arrears ?? []).reduce((sum: number, r: any) => sum + Number(r.current_balance ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Arrears"
        description={`Total outstanding: ${formatCurrency(total)}`}
        action={
          <div className="flex gap-3">
            <ExportButton
              filename="arrears"
              sheetName="Arrears"
              rows={(arrears ?? []).map((r: any) => ({
                Tenant: r.tenants?.trading_name,
                Building: r.buildings?.name,
                Balance: r.current_balance,
                "30 Days": r.days_30,
                "60 Days": r.days_60,
                "90+ Days": r.days_90_plus,
                "As Of": r.as_of_month,
                Status: r.status,
              }))}
            />
            <PdfExportButton
              filename="arrears-report"
              title="Arrears Report"
              subtitle={`Total outstanding: ${formatCurrency(total)}`}
              columns={["Tenant", "Building", "Balance", "30d", "60d", "90d+"]}
              rows={(arrears ?? []).map((r: any) => [
                r.tenants?.trading_name ?? "—",
                r.buildings?.name ?? "—",
                formatCurrency(r.current_balance),
                formatCurrency(r.days_30),
                formatCurrency(r.days_60),
                formatCurrency(r.days_90_plus),
              ])}
            />
          </div>
        }
      />

      {arrears && arrears.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Building</th>
                <th>Balance</th>
                <th>30d</th>
                <th>60d</th>
                <th>90d+</th>
                <th>As Of</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {arrears.map((r: any, i: number) => (
                <tr key={i}>
                  <td>
                    <ArrearsTimelineButton
                      tenantId={r.tenant_id}
                      buildingId={r.building_id}
                      tenantName={r.tenants?.trading_name ?? "Unknown tenant"}
                      currentBalance={r.current_balance}
                      status={r.status}
                    />
                  </td>
                  <td>{r.buildings?.name ?? "—"}</td>
                  <td className={Number(r.current_balance) > 0 ? "text-status-risk" : ""}>
                    {formatCurrency(r.current_balance)}
                  </td>
                  <td>{formatCurrency(r.days_30)}</td>
                  <td>{formatCurrency(r.days_60)}</td>
                  <td>{formatCurrency(r.days_90_plus)}</td>
                  <td>{formatDate(r.as_of_month)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No arrears records yet" />
      )}
    </div>
  );
}
