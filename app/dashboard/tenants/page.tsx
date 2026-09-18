import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ExportButton } from "@/components/ExportButton";
import { PdfExportButton } from "@/components/PdfExportButton";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { TenantFormButton } from "./TenantForm";
import { TenantImportButton } from "./TenantImport";

export default async function TenantsPage() {
  const supabase = createClient();
  const portfolioId = getSelectedPortfolio();

  const { data: buildings } = await supabase
    .from("buildings")
    .select("id, name, portfolio_id")
    .is("archived_at", null)
    .order("name");

  const scopedBuildingIds =
    portfolioId === "all"
      ? null
      : (buildings ?? []).filter((b) => b.portfolio_id === portfolioId).map((b) => b.id);

  let query = supabase
    .from("tenants")
    .select("id, trading_name, shop_number, gla, monthly_rental, lease_end, status, building_id, buildings(name)")
    .is("archived_at", null)
    .order("trading_name");

  if (scopedBuildingIds) query = query.in("building_id", scopedBuildingIds);

  const { data: tenants } = await query;
  const buildingOptions = (buildings ?? []).map((b) => ({ id: b.id, name: b.name }));

  return (
    <div>
      <PageHeader
        title="Tenants"
        description={`${tenants?.length ?? 0} tenants`}
        action={
          <div className="flex gap-3">
            <ExportButton
              filename="tenants"
              sheetName="Tenants"
              rows={(tenants ?? []).map((t: any) => ({
                Building: t.buildings?.name,
                "Trading Name": t.trading_name,
                "Shop Number": t.shop_number,
                "GLA (m²)": t.gla,
                "Monthly Rental": t.monthly_rental,
                "Lease End": t.lease_end,
                Status: t.status,
              }))}
            />
            <PdfExportButton
              filename="tenant-schedule"
              title="Tenant Schedule"
              columns={["Tenant", "Building", "Shop", "GLA", "Rental", "Lease End"]}
              rows={(tenants ?? []).map((t: any) => [
                t.trading_name,
                t.buildings?.name ?? "—",
                t.shop_number ?? "—",
                formatNumber(t.gla),
                formatCurrency(t.monthly_rental),
                formatDate(t.lease_end),
              ])}
            />
            <TenantImportButton buildings={buildingOptions} />
            <TenantFormButton label="+ Add Tenant" buildings={buildingOptions} />
          </div>
        }
      />

      {tenants && tenants.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Building</th>
                <th>Shop</th>
                <th>GLA</th>
                <th>Monthly Rental</th>
                <th>Lease End</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t: any) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/dashboard/tenants/${t.id}`} className="font-medium text-cyan-400 hover:underline">
                      {t.trading_name}
                    </Link>
                  </td>
                  <td>{t.buildings?.name ?? "—"}</td>
                  <td>{t.shop_number ?? "—"}</td>
                  <td>{formatNumber(t.gla)}</td>
                  <td>{formatCurrency(t.monthly_rental)}</td>
                  <td>{formatDate(t.lease_end)}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="text-right">
                    <TenantFormButton tenant={t} label="Edit" buildings={buildingOptions} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No tenants yet" description="Add a tenant or import from Excel." />
      )}
    </div>
  );
}
