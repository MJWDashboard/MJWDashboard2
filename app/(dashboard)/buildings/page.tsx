import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency, formatNumber } from "@/lib/format";
import { BuildingFormButton } from "./BuildingForm";
import { ExportButton } from "@/components/ExportButton";

export default async function BuildingsPage() {
  const supabase = createClient();
  const portfolio = getSelectedPortfolio();

  let query = supabase
    .from("buildings")
    .select("id, name, address, gla, budget, portfolio")
    .is("archived_at", null)
    .order("name");

  if (portfolio !== "all") query = query.eq("portfolio", portfolio);

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
              rows={(buildings ?? []).map((b) => ({
                Name: b.name,
                Address: b.address,
                "GLA (m²)": b.gla,
                Budget: b.budget,
                Portfolio: b.portfolio,
              }))}
            />
            <BuildingFormButton label="+ Add Building" />
          </div>
        }
      />

      {buildings && buildings.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>GLA (m²)</th>
                <th>Budget</th>
                <th>Portfolio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {buildings.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link href={`/buildings/${b.id}`} className="font-medium text-cyan-400 hover:underline">
                      {b.name}
                    </Link>
                  </td>
                  <td>{b.address ?? "—"}</td>
                  <td>{formatNumber(b.gla)}</td>
                  <td>{formatCurrency(b.budget)}</td>
                  <td>{b.portfolio ?? "—"}</td>
                  <td className="text-right">
                    <BuildingFormButton building={b} label="Edit" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No buildings yet"
          description="Add your first building to get started."
        />
      )}
    </div>
  );
}
