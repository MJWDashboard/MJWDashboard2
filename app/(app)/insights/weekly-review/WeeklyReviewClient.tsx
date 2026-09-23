"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { CalendarRange, Check } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { saveWeeklyReview } from "../actions";

const RATINGS = [1, 2, 3, 4, 5];

export function WeeklyReviewClient({
  weekStart,
  stats,
  existing,
}: {
  weekStart: string;
  stats: { tasksCompleted: number; tasksDue: number; totalSpend: string; avgHabitRate: number | null };
  existing: Tables<"weekly_reviews"> | null;
}) {
  const router = useRouter();
  const [wins, setWins] = useState(existing?.wins_note ?? "");
  const [challenges, setChallenges] = useState(existing?.challenges_note ?? "");
  const [priorities, setPriorities] = useState(existing?.priorities_next_week ?? "");
  const [rating, setRating] = useState(existing?.overall_rating ?? 3);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function save() {
    startTransition(async () => {
      await saveWeeklyReview({
        week_start: weekStart,
        wins_note: wins,
        challenges_note: challenges,
        priorities_next_week: priorities,
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
        <p className="text-lg font-semibold text-text">Week reviewed</p>
        <p className="text-sm text-muted">On to the next one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted">
          <CalendarRange size={14} /> Weekly Review
        </p>
        <h1 className="mt-1 text-xl font-semibold text-text">Week of {new Date(weekStart).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</h1>
      </div>

      <div className="card grid grid-cols-3 gap-3 text-center">
        <Stat label="Tasks done" value={`${stats.tasksCompleted}/${stats.tasksDue}`} />
        <Stat label="Spent" value={stats.totalSpend} sensitive />
        <Stat label="Habits" value={stats.avgHabitRate != null ? `${stats.avgHabitRate}%` : "—"} />
      </div>

      <Field label="What went well this week?">
        <textarea value={wins} onChange={(e) => setWins(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </Field>

      <Field label="What was harder than expected?">
        <textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </Field>

      <Field label="Priorities for next week">
        <textarea value={priorities} onChange={(e) => setPriorities(e.target.value)} rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </Field>

      <Field label="How was the week overall?">
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
