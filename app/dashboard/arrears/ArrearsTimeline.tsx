"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/StatusBadge";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/format";
import {
  getArrearsComments,
  addArrearsComment,
  updateArrearsStatus,
  linkArrearsToTenant,
  unlinkArrearsFromTenant,
} from "./actions";

type Comment = {
  id: string;
  comment: string;
  follow_up_date: string | null;
  status: string;
  promise_to_pay_date: string | null;
  promise_to_pay_amount: number | null;
  escalation: boolean;
  created_at: string;
};

export function ArrearsTimelineButton({
  arrearsCurrentId,
  tenantId,
  buildingId,
  displayName,
  currentBalance,
  status,
  matchStatus,
  buildingTenants,
}: {
  arrearsCurrentId: string;
  tenantId: string | null;
  buildingId: string;
  displayName: string;
  currentBalance: number;
  status: string;
  matchStatus: string;
  buildingTenants: { id: string; trading_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [ptpDate, setPtpDate] = useState("");
  const [ptpAmount, setPtpAmount] = useState("");
  const [escalation, setEscalation] = useState(false);
  const [linkTenantId, setLinkTenantId] = useState(tenantId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    getArrearsComments(arrearsCurrentId).then((res) => setComments(res.data as Comment[]));
  }, [open, arrearsCurrentId]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setError(null);

    const result = await addArrearsComment({
      arrears_current_id: arrearsCurrentId,
      tenant_id: tenantId,
      building_id: buildingId,
      comment: text,
      follow_up_date: followUp,
      promise_to_pay_date: ptpDate,
      promise_to_pay_amount: ptpAmount,
      escalation,
    });

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setText("");
    setFollowUp("");
    setPtpDate("");
    setPtpAmount("");
    setEscalation(false);
    const res = await getArrearsComments(arrearsCurrentId);
    setComments(res.data as Comment[]);
    router.refresh();
  }

  async function handleStatusChange(newStatus: string) {
    await updateArrearsStatus(arrearsCurrentId, newStatus);
    router.refresh();
  }

  async function handleLinkChange(newTenantId: string) {
    setLinkTenantId(newTenantId);
    if (newTenantId) {
      await linkArrearsToTenant(arrearsCurrentId, newTenantId);
    } else {
      await unlinkArrearsFromTenant(arrearsCurrentId);
    }
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-cyan-400 hover:underline">
        {displayName}
      </button>

      {open && (
        <Modal title={`Arrears — ${displayName}`} onClose={() => setOpen(false)}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-lg font-semibold text-status-risk">{formatCurrency(currentBalance)}</p>
            <select
              className="input w-auto text-sm"
              defaultValue={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_on_feedback">Waiting on Feedback</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          {matchStatus !== "matched" && (
            <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
              <p className="mb-2 text-xs text-yellow-400">
                This debtor is {matchStatus} to a Tenant Master record.
              </p>
              <select
                className="input text-sm"
                value={linkTenantId}
                onChange={(e) => handleLinkChange(e.target.value)}
              >
                <option value="">— Not linked —</option>
                {buildingTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.trading_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleAddComment} className="mb-5 space-y-3 border-b border-charcoal-700 pb-5">
            <textarea
              rows={2}
              placeholder="Add a comment - payment arrangement, dispute, promise to pay…"
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Follow-up</label>
                <input type="date" className="input" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              </div>
              <div>
                <label className="label">PTP Date</label>
                <input type="date" className="input" value={ptpDate} onChange={(e) => setPtpDate(e.target.value)} />
              </div>
              <div>
                <label className="label">PTP Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={ptpAmount}
                  onChange={(e) => setPtpAmount(e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal-300">
              <input
                type="checkbox"
                checked={escalation}
                onChange={(e) => setEscalation(e.target.checked)}
              />
              Flag for escalation
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Add Comment"}
              </button>
            </div>
          </form>

          <div className="max-h-72 space-y-4 overflow-y-auto">
            {comments === null && <p className="text-sm text-charcoal-400">Loading…</p>}
            {comments && comments.length === 0 && (
              <p className="text-sm text-charcoal-400">No comments yet.</p>
            )}
            {comments?.map((c) => (
              <div key={c.id} className="text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs text-charcoal-400">{formatDateTime(c.created_at)}</span>
                  {c.escalation && (
                    <Badge label="Escalated" className="bg-red-500/20 text-red-400" />
                  )}
                </div>
                <p className="text-charcoal-100">{c.comment}</p>
                {(c.follow_up_date || c.promise_to_pay_date) && (
                  <p className="mt-1 text-xs text-charcoal-400">
                    {c.follow_up_date && `Follow-up: ${formatDate(c.follow_up_date)}`}
                    {c.follow_up_date && c.promise_to_pay_date && " · "}
                    {c.promise_to_pay_date &&
                      `PTP: ${formatDate(c.promise_to_pay_date)} (${formatCurrency(c.promise_to_pay_amount)})`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
