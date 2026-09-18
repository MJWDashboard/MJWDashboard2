"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { replyToMessage, updateMessageStatus } from "../actions";
import type { Database } from "@/lib/supabase/database.types";

type MessageStatus = Database["public"]["Enums"]["record_status"];

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_feedback", label: "Waiting on Feedback" },
  { value: "complete", label: "Complete" },
];

type Reply = {
  id: string;
  body: string;
  createdAt: string;
  authorEmail: string;
  isMe: boolean;
};

export function ThreadPanel({
  messageId,
  status,
  canEditStatus,
  replies,
}: {
  messageId: string;
  status: MessageStatus;
  canEditStatus: boolean;
  replies: Reply[];
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleStatusChange(newStatus: MessageStatus) {
    setBusy(true);
    await updateMessageStatus(messageId, newStatus);
    setCurrentStatus(newStatus);
    setBusy(false);
    router.refresh();
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await replyToMessage(messageId, reply);
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
            onChange={(e) => handleStatusChange(e.target.value as MessageStatus)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <StatusBadge status={currentStatus} />
        )}
      </div>

      <div className="space-y-3">
        {replies.length === 0 && (
          <p className="text-sm text-charcoal-500">No replies yet.</p>
        )}
        {replies.map((r) => (
          <div
            key={r.id}
            className={`card ${r.isMe ? "border-cyan-700/40 bg-cyan-950/10" : ""}`}
          >
            <div className="mb-1 flex items-center justify-between text-xs text-charcoal-400">
              <span className="text-charcoal-200">{r.authorEmail}</span>
              <span>{formatDateTime(r.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-charcoal-100">{r.body}</p>
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
