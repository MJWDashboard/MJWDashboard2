"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/StatusBadge";
import { RENEWAL_STATUS_CLASSES, RENEWAL_STATUS_LABELS } from "@/lib/status";
import { formatDate, formatDateTime } from "@/lib/format";
import { updateLeaseRenewalStatus, addLeaseRenewalNote } from "./actions";

const RENEWAL_STATUS_OPTIONS = Object.entries(RENEWAL_STATUS_LABELS);

type Note = { id: string; comment: string; created_at: string };

type Renewal = {
  id: string;
  shop_number: string | null;
  lease_end: string;
  renewal_status: string;
  daysRemaining: number;
  buildings: { name: string } | null;
  tenants: { trading_name: string } | null;
  lease_renewal_notes: Note[];
};

function urgencyClasses(days: number): string {
  if (days < 0) return "bg-red-500/20 text-red-400";
  if (days <= 90) return "bg-orange-500/20 text-orange-400";
  if (days <= 180) return "bg-yellow-500/20 text-yellow-400";
  return "bg-charcoal-600/60 text-charcoal-200";
}

function urgencyLabel(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Ends today";
  return `${days}d left`;
}

function RenewalRow({ renewal }: { renewal: Renewal }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(renewal.renewal_status);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleStatusChange(next: string) {
    setStatus(next);
    setSaving(true);
    setError(null);
    const result = await updateLeaseRenewalStatus(renewal.id, next);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      setStatus(renewal.renewal_status);
      return;
    }
    router.refresh();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const result = await addLeaseRenewalNote(renewal.id, comment);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setComment("");
    router.refresh();
  }

  return (
    <>
      <tr>
        <td>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 font-medium text-cyan-400 hover:underline"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {renewal.tenants?.trading_name ?? "—"}
          </button>
        </td>
        <td>{renewal.buildings?.name ?? "—"}</td>
        <td>{renewal.shop_number ?? "—"}</td>
        <td>{formatDate(renewal.lease_end)}</td>
        <td>
          <Badge label={urgencyLabel(renewal.daysRemaining)} className={urgencyClasses(renewal.daysRemaining)} />
        </td>
        <td>
          <select
            className="input py-1 text-xs"
            value={status}
            disabled={saving}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {RENEWAL_STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </td>
        <td>{renewal.lease_renewal_notes.length}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-charcoal-800/40">
            <div className="p-4">
              <form onSubmit={handleAddNote} className="mb-3 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Log a discussion point, e.g. terms sent 12 Sept, tenant reviewing..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button type="submit" disabled={saving || !comment.trim()} className="btn-primary">
                  {saving ? "Saving…" : "Add Note"}
                </button>
              </form>
              {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
              {renewal.lease_renewal_notes.length > 0 ? (
                <ul className="space-y-2">
                  {renewal.lease_renewal_notes.map((n) => (
                    <li key={n.id} className="text-sm">
                      <p className="text-charcoal-100">{n.comment}</p>
                      <p className="text-xs text-charcoal-400">{formatDateTime(n.created_at)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-charcoal-400">No discussion logged yet.</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function RenewalRiskList({ renewals }: { renewals: Renewal[] }) {
  if (renewals.length === 0) {
    return (
      <p className="text-sm text-charcoal-400">
        No leases end within the next 9 months - nothing here needs a renewal decision yet.
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
            <th>Shop</th>
            <th>Lease End</th>
            <th>Time Left</th>
            <th>Renewal Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {renewals.map((r) => (
            <RenewalRow key={r.id} renewal={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
