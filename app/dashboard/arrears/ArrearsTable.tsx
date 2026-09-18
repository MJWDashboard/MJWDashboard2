"use client";

import { useMemo, useState } from "react";
import { StatusBadge, Badge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrearsTimelineButton } from "./ArrearsTimeline";
import { ArrearsRecordFormButton } from "./ArrearsRecordForm";

const MATCH_CLASSES: Record<string, string> = {
  matched: "bg-green-500/20 text-green-400",
  possible: "bg-yellow-500/20 text-yellow-400",
  unmatched: "bg-charcoal-600/60 text-charcoal-200",
};

export function ArrearsTable({
  rows,
  buildings,
  tenants,
  initialBuildingId,
}: {
  rows: any[];
  buildings: { id: string; name: string }[];
  tenants: { id: string; building_id: string; trading_name: string }[];
  initialBuildingId?: string;
}) {
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState(initialBuildingId ?? "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskOnly, setRiskOnly] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (buildingFilter !== "all" && r.building_id !== buildingFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (riskOnly && !r.risk) return false;
      const name = r.tenants?.trading_name ?? r.debtor_name ?? "";
      if (term && !`${name} ${r.account_number ?? ""}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, search, buildingFilter, statusFilter, riskOnly]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="input w-56"
          placeholder="Search debtor or account…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_on_feedback">Waiting on Feedback</option>
          <option value="complete">Complete</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-charcoal-300">
          <input type="checkbox" checked={riskOnly} onChange={(e) => setRiskOnly(e.target.checked)} />
          Risk only
        </label>
      </div>

      <div className="table-shell">
        <table className="table-base">
          <thead>
            <tr>
              <th>Debtor</th>
              <th>Building</th>
              <th>Account</th>
              <th>Balance</th>
              <th>30d</th>
              <th>60d</th>
              <th>90d+</th>
              <th>Match</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={r.risk ? "bg-red-500/5" : ""}>
                <td>
                  <ArrearsTimelineButton
                    arrearsCurrentId={r.id}
                    tenantId={r.tenant_id}
                    buildingId={r.building_id}
                    displayName={r.tenants?.trading_name ?? r.debtor_name ?? "Unknown debtor"}
                    currentBalance={r.current_balance}
                    status={r.status}
                    matchStatus={r.match_status}
                    buildingTenants={tenants.filter((t) => t.building_id === r.building_id)}
                  />
                </td>
                <td>{r.buildings?.name ?? "—"}</td>
                <td>{r.account_number ?? "—"}</td>
                <td className={Number(r.current_balance) > 0 ? "text-status-risk" : ""}>
                  {formatCurrency(r.current_balance)}
                </td>
                <td>{formatCurrency(r.days_30)}</td>
                <td>{formatCurrency(r.days_60)}</td>
                <td>{formatCurrency(r.days_90_plus)}</td>
                <td>
                  <Badge
                    label={r.match_status}
                    className={`capitalize ${MATCH_CLASSES[r.match_status] ?? MATCH_CLASSES.unmatched}`}
                  />
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="text-right">
                  <ArrearsRecordFormButton record={r} label="Edit" buildings={buildings} tenants={tenants} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
