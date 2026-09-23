"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Check, Calendar as CalendarIcon, ArrowRight, Sunrise } from "lucide-react";
import { clsx } from "clsx";
import type { Task } from "@/lib/planTypes";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { setTaskStatus, rescheduleTask, archiveTask, updateTask, setTodayPriority, setMainFocus } from "../actions";

type EventRow = Tables<"events">;

const STEPS = ["Carried over", "Today's calendar", "Pick priorities", "Estimate & confirm"] as const;

export function MorningReviewClient({
  carriedOver,
  candidates,
  events,
}: {
  carriedOver: Task[];
  candidates: Task[];
  events: EventRow[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string[]>([]);
  const [durations, setDurations] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const remainingCarried = carriedOver.filter((t) => !resolved.has(t.id));
  const remainingCandidates = useMemo(
    () => candidates.filter((c) => !carriedOver.some((co) => co.id === c.id) || resolved.has(c.id)),
    [candidates, carriedOver, resolved]
  );

  function resolve(id: string) {
    setResolved((prev) => new Set(prev).add(id));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  async function confirm() {
    startTransition(async () => {
      for (let i = 0; i < selected.length; i++) {
        const id = selected[i];
        const minutes = Number(durations[id]) || null;
        await updateTask(id, { estimated_minutes: minutes });
        await setTodayPriority(id, true);
        if (i === 0) await setMainFocus(id);
      }
      setDone(true);
      setTimeout(() => router.push("/today"), 900);
    });
  }

  if (done) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Check size={32} className="text-ok" />
        <p className="text-lg font-semibold text-text">Today Plan ready</p>
        <p className="text-sm text-muted">Taking you to Today...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted">
          <Sunrise size={14} /> Morning Review
        </p>
        <h1 className="mt-1 text-xl font-semibold text-text">{STEPS[step]}</h1>
        <div className="mt-2 flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={clsx("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-border")} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="space-y-2">
          {remainingCarried.length === 0 ? (
            <EmptyState icon={Check} title="Nothing carried over" detail="Yesterday's open items are all clear." />
          ) : (
            remainingCarried.map((task) => (
              <div key={task.id} className="card flex items-center justify-between gap-2">
                <p className="text-sm text-text">{task.title}</p>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => startTransition(async () => { await setTaskStatus(task.id, "complete"); resolve(task.id); })}
                    className="btn-secondary px-2 py-1 text-xs"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => startTransition(async () => { await rescheduleTask(task.id, format(new Date(), "yyyy-MM-dd")); resolve(task.id); })}
                    className="btn-secondary px-2 py-1 text-xs"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => startTransition(async () => { await archiveTask(task.id); resolve(task.id); })}
                    className="btn-secondary px-2 py-1 text-xs text-overdue"
                  >
                    Drop
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-2">
          {events.length === 0 ? (
            <EmptyState icon={CalendarIcon} title="Nothing on the calendar" detail="A clear day to work with." />
          ) : (
            events.map((e) => (
              <div key={e.id} className="card flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs text-muted">{format(new Date(e.starts_at), "HH:mm")}</span>
                <span className="text-sm text-text">{e.title}</span>
              </div>
            ))
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <p className="text-xs text-muted">Pick up to 3 — {selected.length}/3 selected.</p>
          {remainingCandidates.length === 0 ? (
            <EmptyState icon={Check} title="Nothing in the backlog" detail="Add a task in Plan first." />
          ) : (
            remainingCandidates.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleSelect(task.id)}
                className={clsx("card flex w-full items-center justify-between text-left", selected.includes(task.id) && "border-accent")}
              >
                <span className="text-sm text-text">{task.title}</span>
                {selected.includes(task.id) && <Check size={16} className="shrink-0 text-accent" />}
              </button>
            ))
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          {selected.length === 0 ? (
            <p className="text-sm text-muted">No priorities selected — you can still confirm and plan manually in Plan.</p>
          ) : (
            candidates
              .filter((c) => selected.includes(c.id))
              .map((task) => (
                <div key={task.id} className="card flex items-center justify-between gap-2">
                  <span className="text-sm text-text">{task.title}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="min"
                    value={durations[task.id] ?? ""}
                    onChange={(e) => setDurations((prev) => ({ ...prev, [task.id]: e.target.value }))}
                    className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
                  />
                </div>
              ))
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="btn-secondary flex-1">
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep((s) => s + 1)} className="btn-primary flex flex-1 items-center justify-center gap-1.5">
            Next <ArrowRight size={15} />
          </button>
        ) : (
          <button onClick={confirm} disabled={pending} className="btn-primary flex-1">
            {pending ? "Saving..." : "Confirm Today Plan"}
          </button>
        )}
      </div>
    </div>
  );
}
