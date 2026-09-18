import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { getSelectedBuilding } from "@/lib/building";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { TurnoverFormButton } from "./TurnoverForm";
import { TurnoversTable } from "./TurnoversTable";
import { SyncCertificatesButton, AnnualCertificatesTable } from "./AnnualCertificates";
import { TurnoverImportButton } from "./TurnoverImport";
import { TemplateDownloadButton } from "@/components/TemplateDownloadButton";
import { ExportButton } from "@/components/ExportButton";

export default async function TurnoversPage({
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
    .from("turnovers")
    .select(
      "id, tenant_id, building_id, unit, period, turnover_amount, turnover_rental, submitted, due_date, status, penalty_applicable, penalty_amount, penalty_status, notes, tenants(trading_name), buildings(name)"
    )
    .is("archived_at", null)
    .order("period", { ascending: false });

  let certQuery = supabase
    .from("turnover_annual_certificates")
    .select("id, financial_year, due_date, received_at, status, tenant_id, building_id, tenants(trading_name), buildings(name)")
    .order("due_date", { ascending: true });

  if (scopedIds) {
    query = query.in("building_id", scopedIds);
    certQuery = certQuery.in("building_id", scopedIds);
  }

  const [{ data: turnovers }, { data: tenants }, { data: certificates }] = await Promise.all([
    query,
    supabase
      .from("tenants")
      .select("id, trading_name, building_id, shop_number, monthly_turnover_required")
      .is("archived_at", null)
      .order("trading_name"),
    certQuery,
  ]);

  const buildingOptions = (allBuildings ?? []).filter((b) => !scopedIds || scopedIds.includes(b.id)).map((b) => ({ id: b.id, name: b.name }));

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const missingThisMonth = (tenants ?? []).filter(
    (t) =>
      t.monthly_turnover_required &&
      (scopedIds === null || scopedIds.includes(t.building_id)) &&
      !(turnovers ?? []).some((tu) => tu.tenant_id === t.id && tu.period.slice(0, 7) === currentPeriod)
  );

  return (
    <div>
      <PageHeader
        title="Turnovers"
        description={`${turnovers?.length ?? 0} records - monthly compliance register`}
        action={<div className="flex flex-wrap gap-3"><TurnoverImportButton /><TemplateDownloadButton filename="VOREXA-TURNOVERS-v1.xlsx" sheetName="Turnovers" headers={["Building Code", "Tenant Account Number", "Trading Name", "Shop Number", "Period", "Turnover Amount (R)", "Turnover Rental (R)", "Submitted by Tenant", "Submission Date", "Penalty Applicable", "Penalty Amount (R)", "Annual Certificate Required", "Financial Year End", "Annual Certificate Due Date", "Annual Certificate Received Date", "Notes"]}/><ExportButton filename="turnovers" sheetName="Turnovers" rows={(turnovers ?? []).map((item: any) => ({ Building: item.buildings?.name, Tenant: item.tenants?.trading_name, Period: item.period, "Turnover Amount (R)": item.turnover_amount, "Turnover Rental (R)": item.turnover_rental, Status: item.status }))}/><TurnoverFormButton label="+ Add Turnover" tenants={tenants ?? []} /></div>}
      />

      {missingThisMonth.length > 0 && (
        <div className="card mb-6 border-yellow-500/30 bg-yellow-500/5">
          <h2 className="mb-2 text-sm font-semibold text-yellow-400">
            {missingThisMonth.length} tenant{missingThisMonth.length === 1 ? "" : "s"} missing this month&apos;s
            turnover
          </h2>
          <p className="text-sm text-charcoal-300">
            {missingThisMonth.map((t) => t.trading_name).join(", ")}
          </p>
        </div>
      )}

      {buildingId && (
        <FilterChip
          label={buildingOptions.find((b) => b.id === buildingId)?.name ?? "building"}
          clearHref="/dashboard/turnovers"
        />
      )}

      {turnovers && turnovers.length > 0 ? (
        <TurnoversTable
          turnovers={turnovers}
          tenants={tenants ?? []}
          buildings={buildingOptions}
          initialBuildingId={buildingId}
        />
      ) : (
        <EmptyState title="No turnover records yet" />
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-charcoal-100">Annual Turnover Certificates</h2>
          <SyncCertificatesButton />
        </div>
        <AnnualCertificatesTable certificates={certificates ?? []} />
      </div>
    </div>
  );
}
