"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { computeAnnualStatus, STATUS_LABELS, STATUS_CLASSES } from "@/lib/turnovers";
import { syncAnnualCertificates, markCertificateReceived } from "./actions";

export function SyncCertificatesButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const result = await syncAnnualCertificates();
    setLoading(false);
    if (!result.error) router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-secondary">
      <RefreshCw size={16} />
      {loading ? "Syncing…" : "Sync Annual Certificates"}
    </button>
  );
}

export function AnnualCertificatesTable({ certificates }: { certificates: any[] }) {
  const router = useRouter();

  async function toggle(id: string, current: boolean) {
    await markCertificateReceived(id, !current);
    router.refresh();
  }

  if (certificates.length === 0) {
    return (
      <p className="text-sm text-charcoal-400">
        No annual certificates tracked yet. Use &quot;Sync Annual Certificates&quot; to generate this year&apos;s
        requirements from each tenant&apos;s financial year end.
      </p>
    );
  }

  return (
    <div className="table-shell">
      <table className="table-base">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Building</th>
            <th>Financial Year</th>
            <th>Due</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {certificates.map((c) => {
            const status = computeAnnualStatus(c.due_date, c.received_at, c.status);
            return (
              <tr key={c.id}>
                <td className="font-medium">{c.tenants?.trading_name ?? "—"}</td>
                <td>{c.buildings?.name ?? "—"}</td>
                <td>{c.financial_year}</td>
                <td>{formatDate(c.due_date)}</td>
                <td>
                  <Badge label={STATUS_LABELS[status]} className={STATUS_CLASSES[status]} />
                </td>
                <td className="text-right">
                  <button
                    onClick={() => toggle(c.id, Boolean(c.received_at))}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    {c.received_at ? "Mark Outstanding" : "Mark Received"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
