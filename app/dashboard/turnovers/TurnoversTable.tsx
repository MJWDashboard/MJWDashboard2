"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { computeMonthlyStatus, STATUS_LABELS, STATUS_CLASSES } from "@/lib/turnovers";
import { TurnoverFormButton } from "./TurnoverForm";

export function TurnoversTable({
  turnovers,
  tenants,
  buildings,
}: {
  turnovers: any[];
  tenants: { id: string; trading_name: string; building_id: string; shop_number: string | null }[];
  buildings: { id: string; name: string }[];
}) {
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(
    () =>
      turnovers.map((t) => ({
        ...t,
        computedStatus: computeMonthlyStatus(t.due_date, t.submitted, t.status),
      })),
    [turnovers]
  );

  const filtered = rows.filter((r) => {
    if (buildingFilter !== "all" && r.building_id !== buildingFilter) return false;
    if (statusFilter !== "all" && r.computedStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className="input w-auto" value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
          <option value="all">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="table-shell">
        <table className="table-base">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Building</th>
              <th>Period</th>
              <th>Turnover</th>
              <th>Due</th>
              <th>Status</th>
              <th>Penalty</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">{t.tenants?.trading_name ?? "—"}</td>
                <td>{t.buildings?.name ?? "—"}</td>
                <td>{formatDate(t.period)}</td>
                <td>{formatCurrency(t.turnover_amount)}</td>
                <td>{formatDate(t.due_date)}</td>
                <td>
                  <Badge label={STATUS_LABELS[t.computedStatus as keyof typeof STATUS_LABELS]} className={STATUS_CLASSES[t.computedStatus as keyof typeof STATUS_CLASSES]} />
                </td>
                <td>
                  {t.penalty_applicable ? (
                    <Badge
                      label={`${formatCurrency(t.penalty_amount)} · ${t.penalty_status ?? "—"}`}
                      className="bg-red-500/20 text-red-400"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="text-right">
                  <TurnoverFormButton turnover={t} label="Edit" tenants={tenants} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
