import { Fragment } from "react";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

type BuildingRow = {
  id: string;
  name: string;
  tenants: number;
  arrears: number;
  missingTurnovers: number;
  openActions: number;
  highRiskItems: number;
};

type PortfolioGroup = {
  portfolioName: string;
  buildings: BuildingRow[];
};

function sum(buildings: BuildingRow[], key: keyof Omit<BuildingRow, "id" | "name">): number {
  return buildings.reduce((total, b) => total + b[key], 0);
}

export function PortfolioBreakdown({ groups }: { groups: PortfolioGroup[] }) {
  if (groups.length === 0) {
    return (
      <div>
        <h2 className="mb-3 text-sm font-semibold text-charcoal-100">Breakdown by Portfolio & Building</h2>
        <EmptyState title="No buildings in view" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-charcoal-100">Breakdown by Portfolio & Building</h2>
      <p className="mb-3 text-sm text-charcoal-400">
        Every portfolio and building you have oversight of, for drill-down reporting.
      </p>
      <div className="table-shell">
        <table className="table-base">
          <thead>
            <tr>
              <th>Portfolio / Building</th>
              <th>Tenants</th>
              <th>Arrears</th>
              <th>Missing Turnovers</th>
              <th>Open Actions</th>
              <th>High-Risk Findings</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.portfolioName}>
                <tr className="bg-charcoal-800/40">
                  <td className="font-semibold text-charcoal-100">{group.portfolioName}</td>
                  <td className="font-semibold text-charcoal-100">{sum(group.buildings, "tenants")}</td>
                  <td className="font-semibold text-charcoal-100">{formatCurrency(sum(group.buildings, "arrears"))}</td>
                  <td className="font-semibold text-charcoal-100">{sum(group.buildings, "missingTurnovers")}</td>
                  <td className="font-semibold text-charcoal-100">{sum(group.buildings, "openActions")}</td>
                  <td className="font-semibold text-charcoal-100">{sum(group.buildings, "highRiskItems")}</td>
                </tr>
                {group.buildings.map((b) => (
                  <tr key={b.id}>
                    <td className="pl-6 text-charcoal-300">{b.name}</td>
                    <td>{b.tenants}</td>
                    <td>{formatCurrency(b.arrears)}</td>
                    <td className={b.missingTurnovers > 0 ? "text-yellow-400" : ""}>{b.missingTurnovers}</td>
                    <td>{b.openActions}</td>
                    <td className={b.highRiskItems > 0 ? "text-red-400" : ""}>{b.highRiskItems}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
