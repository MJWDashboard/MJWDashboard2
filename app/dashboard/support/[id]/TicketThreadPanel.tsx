"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { replyToTicket, updateTicketStatus } from "../actions";
import { TICKET_STATUS_OPTIONS, TICKET_STATUS_LABEL, TICKET_STATUS_CLASSES } from "../roles";
import type { TicketStatus } from "../actions";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorEmail: string;
  isMe: boolean;
};

export function TicketThreadPanel({
  ticketId,
  status,
  canEditStatus,
  comments,
}: {
  ticketId: string;
  status: TicketStatus;
  canEditStatus: boolean;
  comments: Comment[];
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleStatusChange(newStatus: TicketStatus) {
    setBusy(true);
    await updateTicketStatus(ticketId, newStatus);
    setCurrentStatus(newStatus);
    setBusy(false);
    router.refresh();
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await replyToTicket(ticketId, reply);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setReply("");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-charcoal-100">Thread</h2>
        {canEditStatus ? (
          <select
            className="input w-auto py-1 text-xs"
            value={currentStatus}
            disabled={busy}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
          >
            {TICKET_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <Badge label={TICKET_STATUS_LABEL[currentStatus]} className={TICKET_STATUS_CLASSES[currentStatus]} />
        )}
      </div>

      <div className="space-y-3">
        {comments.length === 0 && <p className="text-sm text-charcoal-500">No replies yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className={`card ${c.isMe ? "border-cyan-700/40 bg-cyan-950/10" : ""}`}>
            <div className="mb-1 flex items-center justify-between text-xs text-charcoal-400">
              <span className="text-charcoal-200">{c.authorEmail}</span>
              <span>{formatDateTime(c.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-charcoal-100">{c.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="card mt-4 space-y-3">
        <label className="label">Reply</label>
        <textarea
          required
          className="input min-h-20"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply…"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Sending…" : "Send Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
