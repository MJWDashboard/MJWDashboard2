"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { addLeasingDealFeedback } from "../actions";

type Feedback = { id: string; comment: string; created_at: string };

export function FeedbackLog({ dealId, feedback }: { dealId: string; feedback: Feedback[] }) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await addLeasingDealFeedback(dealId, comment);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setComment("");
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-sm font-semibold">Feedback Log</h2>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Log feedback from a call, viewing or negotiation..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit" disabled={loading || !comment.trim()} className="btn-primary">
          {loading ? "Saving…" : "Add"}
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {feedback.length > 0 ? (
        <ul className="space-y-3">
          {feedback.map((f) => (
            <li key={f.id} className="text-sm">
              <p className="text-charcoal-100">{f.comment}</p>
              <p className="text-xs text-charcoal-400">{formatDateTime(f.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-charcoal-400">No feedback logged yet.</p>
      )}
    </div>
  );
}
