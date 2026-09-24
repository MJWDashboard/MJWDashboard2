"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { CalendarDays, Check } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { saveMonthlyReview } from "../actions";

const RATINGS = [1, 2, 3, 4, 5];

export function MonthlyReviewClient({
  reviewMonth,
  stats,
  existing,
}: {
  reviewMonth: string;
  stats: { income: string; expenses: string; netWorthChange: string | null; activeGoals: number };
  existing: Tables<"monthly_reviews"> | null;
}) {
  const router = useRouter();
  const [netWorthNote, setNetWorthNote] = useState(existing?.net_worth_note ?? "");
  const [spendingNote, setSpendingNote] = useState(existing?.spending_note ?? "");
  const [goalsNote, setGoalsNote] = useState(existing?.goals_note ?? "");
  const [focusNextMonth, setFocusNextMonth] = useState(existing?.focus_next_month ?? "");
  const [rating, setRating] = useState(existing?.overall_rating ?? 3);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function save() {
    startTransition(async () => {
      await saveMonthlyReview({
        review_month: reviewMonth,
        net_worth_note: netWorthNote,
        spending_note: spendingNote,
        goals_note: goalsNote,
        focus_next_month: focusNextMonth,
        overall_rating: rating,
      });
      setDone(true);
      setTimeout(() => router.push("/insights"), 800);
    });
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Check size={32} className="text-ok" />
        <p className="text-lg font-semibold text-text">Month reviewed</p>
        <p className="text-sm text-muted">On to the next one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted">
          <CalendarDays size={14} /> Monthly Review
        </p>
        <h1 className="mt-1 text-xl font-semibold text-text">{new Date(reviewMonth).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}</h1>
      </div>

      <div className="card grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <Stat label="Income" value={stats.income} sensitive />
        <Stat label="Expenses" value={stats.expenses} sensitive />
        <Stat label="Net worth" value={stats.netWorthChange ?? "—"} sensitive />
        <Stat label="Active goals" value={String(stats.activeGoals)} />
      </div>

      <Field label="How did your net worth move, and why?">
        <textarea value={netWorthNote} onChange={(e) => setNetWorthNote(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </Field>

      <Field label="Any spending pattern worth changing?">
        <textarea value={spendingNote} onChange={(e) => setSpendingNote(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </Field>

      <Field label="Progress on goals this month">
        <textarea value={goalsNote} onChange={(e) => setGoalsNote(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </Field>

      <Field label="Focus for next month">
        <textarea value={focusNextMonth} onChange={(e) => setFocusNextMonth(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </Field>

      <Field label="How was the month overall?">
        <div className="flex gap-2">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className={clsx("flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium", rating === r ? "border-accent bg-accent text-white" : "border-border text-muted")}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>

      <button onClick={save} disabled={pending} className="btn-primary w-full">
        {pending ? "Saving..." : "Save review"}
      </button>
    </div>
  );
}

function Stat({ label, value, sensitive }: { label: string; value: string; sensitive?: boolean }) {
  return (
    <div>
      <p data-sensitive={sensitive || undefined} className="tabular text-base font-semibold text-text">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
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
