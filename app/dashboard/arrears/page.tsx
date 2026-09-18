import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { getSelectedBuilding } from "@/lib/building";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ExportButton } from "@/components/ExportButton";
import { PdfExportButton } from "@/components/PdfExportButton";
import { FilterChip } from "@/components/FilterChip";
import { formatCurrency } from "@/lib/format";
import { ArrearsImportButton } from "./ArrearsImport";
import { ArrearsRecordFormButton } from "./ArrearsRecordForm";
import { ArrearsTable } from "./ArrearsTable";

export default async function ArrearsPage({
  searchParams,
}: {
  searchParams: { building_id?: string };
}) {
  const supabase = createClient();
  const portfolioId = getSelectedPortfolio();
  const selectedBuilding = getSelectedBuilding();
  const buildingId = searchParams.building_id ?? (selectedBuilding !== "all" ? selectedBuilding : undefined);

  const { data: allBuildings } = await supabase
    .from("buildings")
    .select("id, name, portfolio_id")
    .is("archived_at", null);

  const scopedIds = buildingId
      ? [buildingId]
      : portfolioId === "all"
      ? null
      : (allBuildings ?? []).filter((b) => b.portfolio_id === portfolioId).map((b) => b.id);

  let query = supabase
    .from("arrears_current")
    .select(
      "id, tenant_id, building_id, debtor_name, account_number, match_status, current_balance, days_30, days_60, days_90_plus, as_of_month, status, risk, tenants(trading_name), buildings(name)"
    )
    .order("current_balance", { ascending: false });

  if (scopedIds) query = query.in("building_id", scopedIds);

  const [{ data: arrears }, { data: tenants }] = await Promise.all([
    query,
    supabase.from("tenants").select("id, building_id, trading_name").is("archived_at", null),
  ]);

  const total = (arrears ?? []).reduce((sum: number, r: any) => sum + Number(r.current_balance ?? 0), 0);
  const buildingOptions = (allBuildings ?? []).filter((b) => !scopedIds || scopedIds.includes(b.id)).map((b) => ({ id: b.id, name: b.name }));

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
                Debtor: r.tenants?.trading_name ?? r.debtor_name,
                Building: r.buildings?.name,
                Account: r.account_number,
                Match: r.match_status,
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
              columns={["Debtor", "Building", "Balance", "30d", "60d", "90d+"]}
              rows={(arrears ?? []).map((r: any) => [
                r.tenants?.trading_name ?? r.debtor_name ?? "—",
                r.buildings?.name ?? "—",
                formatCurrency(r.current_balance),
                formatCurrency(r.days_30),
                formatCurrency(r.days_60),
                formatCurrency(r.days_90_plus),
              ])}
            />
            <ArrearsImportButton buildings={buildingOptions} />
            <ArrearsRecordFormButton label="+ Add Record" buildings={buildingOptions} tenants={tenants ?? []} />
          </div>
        }
      />

      {buildingId && (
        <FilterChip
          label={buildingOptions.find((b) => b.id === buildingId)?.name ?? "building"}
          clearHref="/dashboard/arrears"
        />
      )}

      {arrears && arrears.length > 0 ? (
        <ArrearsTable rows={arrears} buildings={buildingOptions} tenants={tenants ?? []} initialBuildingId={buildingId} />
      ) : (
        <EmptyState title="No arrears records yet" description="Upload an arrears export or add a record manually." />
      )}
    </div>
  );
}
