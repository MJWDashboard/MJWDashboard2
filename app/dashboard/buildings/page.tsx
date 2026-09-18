import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency, formatNumber } from "@/lib/format";
import { BuildingFormButton } from "./BuildingForm";
import { ExportButton } from "@/components/ExportButton";

export default async function BuildingsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const portfolioId = getSelectedPortfolio();

  const { data: portfolios } = await supabase.from("portfolios").select("id, name").order("name");

  let isUnassignedTeamMember = false;
  if (user && user.role !== "admin") {
    const { data: portfolioRoles } = await supabase
      .from("portfolio_users")
      .select("role")
      .eq("user_id", user.id);
    isUnassignedTeamMember = (portfolioRoles ?? []).every(
      (r) => r.role !== "portfolio_manager" && r.role !== "portfolio_administrator"
    );
  }

  let query = supabase
    .from("buildings")
    .select("*, portfolios(name)")
    .is("archived_at", null)
    .order("name");

  if (portfolioId !== "all") query = query.eq("portfolio_id", portfolioId);

  const { data: buildings } = await query;

  return (
    <div>
      <PageHeader
        title="Buildings"
        description={`${buildings?.length ?? 0} buildings`}
        action={
          <div className="flex gap-3">
            <ExportButton
              filename="buildings"
              sheetName="Buildings"
              rows={(buildings ?? []).map((b: any) => ({
                "Building Code": b.building_code,
                Name: b.name,
                "Address Line 1": b.address_line_1,
                "Address Line 2": b.address_line_2,
                Suburb: b.suburb,
                City: b.city,
                Province: b.province,
                "Postal Code": b.postal_code,
                "GLA (m²)": b.gla,
                "Budget Year": b.budget_year,
                "Annual Budget (R)": b.annual_budget,
                Active: b.active,
                Portfolio: b.portfolios?.name,
              }))}
            />
            <BuildingFormButton label="+ Add Building" portfolios={portfolios ?? []} />
          </div>
        }
      />

      {buildings && buildings.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Address</th>
                <th>GLA (m²)</th>
                <th>Annual Budget</th>
                <th>Portfolio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {buildings.map((b: any) => (
                <tr key={b.id}>
                  <td className="font-medium text-charcoal-300">{b.building_code ?? "—"}</td>
                  <td>
                    <Link href={`/dashboard/buildings/${b.id}`} className="font-medium text-cyan-400 hover:underline">
                      {b.name}
                    </Link>
                  </td>
                  <td>{[b.address_line_1, b.suburb, b.city].filter(Boolean).join(", ") || "—"}</td>
                  <td>{formatNumber(b.gla)}</td>
                  <td>{formatCurrency(b.annual_budget)}</td>
                  <td>{b.portfolios?.name ?? "—"}</td>
                  <td className="text-right">
                    <BuildingFormButton building={b} label="Edit" portfolios={portfolios ?? []} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={isUnassignedTeamMember ? "No buildings assigned to you yet" : "No buildings yet"}
          description={
            isUnassignedTeamMember
              ? "Ask your portfolio manager to assign you to a building in Team & Access."
              : portfolios && portfolios.length > 0
                ? "Add your first building to get started."
                : "Ask your administrator to create a portfolio first."
          }
        />
      )}
    </div>
  );
}
