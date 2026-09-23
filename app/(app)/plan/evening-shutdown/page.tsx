"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, Check } from "lucide-react";
import { clsx } from "clsx";
import { saveEveningReview } from "../actions";

const RATINGS = [1, 2, 3, 4, 5];

export default function EveningShutdownPage() {
  const router = useRouter();
  const [completedNote, setCompletedNote] = useState("");
  const [carriedForward, setCarriedForward] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [generalNote, setGeneralNote] = useState("");
  const [rating, setRating] = useState(3);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function save() {
    startTransition(async () => {
      await saveEveningReview({
        completed_note: completedNote,
        carried_forward_note: carriedForward,
        expense_note: expenseNote,
        general_note: generalNote,
        overall_rating: rating,
      });
      setDone(true);
      setTimeout(() => router.push("/today"), 800);
    });
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Check size={32} className="text-ok" />
        <p className="text-lg font-semibold text-text">Shutdown complete</p>
        <p className="text-sm text-muted">See you in the morning.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted">
          <Moon size={14} /> Evening Shutdown
        </p>
        <h1 className="mt-1 text-xl font-semibold text-text">Two minutes, then you're done</h1>
      </div>

      <Field label="What was completed?">
        <textarea
          value={completedNote}
          onChange={(e) => setCompletedNote(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </Field>

      <Field label="What must move to tomorrow?">
        <textarea
          value={carriedForward}
          onChange={(e) => setCarriedForward(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </Field>

      <Field label="Any expense to capture?">
        <input
          value={expenseNote}
          onChange={(e) => setExpenseNote(e.target.value)}
          placeholder="Optional — or use Quick Capture"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </Field>

      <Field label="Any note to remember?">
        <input
          value={generalNote}
          onChange={(e) => setGeneralNote(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </Field>

      <Field label="How was today overall?">
        <div className="flex gap-2">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium",
                rating === r ? "border-accent bg-accent text-white" : "border-border text-muted"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>

      <button onClick={save} disabled={pending} className="btn-primary w-full">
        {pending ? "Saving..." : "Finish"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-text">{label}</p>
      {children}
    </div>
  );
}
