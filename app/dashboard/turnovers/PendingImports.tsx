"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { confirmTurnoverBatch, type PendingTurnoverBatch } from "./actions";

export function PendingTurnoverImports({ batches }: { batches: PendingTurnoverBatch[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (batches.length === 0) return null;

  async function confirm(batchId: string) {
    setBusyId(batchId);
    setError(null);
    const result = await confirmTurnoverBatch(batchId);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mb-6 space-y-4">
      {batches.map((batch) => (
        <div key={batch.id} className="card border border-cyan-500/30">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
              <Sparkles size={16} />
              {batch.rows.length} row{batch.rows.length === 1 ? "" : "s"} from your Turnover Workings sheet
            </div>
            <span className="text-xs text-charcoal-400">{formatDateTime(batch.created_at)}</span>
          </div>
          <div className="max-h-64 overflow-auto rounded-md border border-charcoal-700">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Period</th>
                  <th>Turnover</th>
                  <th>Rental</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {batch.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.supplied_data.tradingName || row.supplied_data.accountNumber || "—"}</td>
                    <td>{row.supplied_data.period}</td>
                    <td>{formatCurrency(row.supplied_data.turnoverAmount)}</td>
                    <td>{formatCurrency(row.supplied_data.turnoverRental)}</td>
                    <td className="text-xs text-charcoal-400">{row.warnings[0]?.reason ?? row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-3 flex justify-end">
            <button className="btn-primary" disabled={busyId === batch.id} onClick={() => confirm(batch.id)}>
              {busyId === batch.id ? "Confirming…" : `Confirm ${batch.rows.length} rows`}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
