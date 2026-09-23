"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Moon, Smile, Check } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { computeDuration, averageDurationMinutes, formatDuration, bedtimeConsistency } from "@/lib/sleep";
import { saveWellnessEntry, saveSleepEntry } from "./actions";

type WellnessEntry = Tables<"wellness_entries">;
type SleepEntry = Tables<"sleep_entries">;

const SCALE = [1, 2, 3, 4, 5];

export function CheckInTab({ entries, sleepEntries }: { entries: WellnessEntry[]; sleepEntries: SleepEntry[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find((e) => e.entry_date === today);
  const todaySleep = sleepEntries.find((s) => s.sleep_date === today);

  return (
    <div className="space-y-5">
      <DailyCheckIn today={today} existing={todayEntry} />
      <SleepLogger today={today} existing={todaySleep} history={sleepEntries} />
    </div>
  );
}

function DailyCheckIn({ today, existing }: { today: string; existing?: WellnessEntry }) {
  const [mood, setMood] = useState(existing?.mood ?? 0);
  const [energy, setEnergy] = useState(existing?.energy ?? 0);
  const [stress, setStress] = useState(existing?.stress ?? 0);
  const [note, setNote] = useState(existing?.note ?? "");
  const [gratitude, setGratitude] = useState(existing?.gratitude ?? "");
  const [highlight, setHighlight] = useState(existing?.highlight ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await saveWellnessEntry({
        entry_date: today,
        mood: mood || null,
        energy: energy || null,
        stress: stress || null,
        sleep_quality: existing?.sleep_quality ?? null,
        note: note.trim() || null,
        symptoms: existing?.symptoms ?? null,
        gratitude: gratitude.trim() || null,
        highlight: highlight.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="card space-y-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-text">
        <Smile size={14} /> Daily check-in
      </p>
      <ScaleField label="Mood" value={mood} onChange={setMood} />
      <ScaleField label="Energy" value={energy} onChange={setEnergy} />
      <ScaleField label="Stress" value={stress} onChange={setStress} />
      <input value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="Highlight of the day (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent" />
      <input value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="Grateful for... (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent" />
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">
        {saved ? <><Check size={14} className="inline" /> Saved</> : pending ? "Saving..." : "Save check-in"}
      </button>
    </div>
  );
}

function ScaleField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted">{label}</p>
      <div className="flex gap-1.5">
        {SCALE.map((n) => (
          <button
            key={n}
            onClick={() => onChange(value === n ? 0 : n)}
            className={clsx(
              "flex h-8 flex-1 items-center justify-center rounded-lg border text-xs font-medium",
              value === n ? "border-accent bg-accent text-white" : "border-border text-muted"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function SleepLogger({ today, existing, history }: { today: string; existing?: SleepEntry; history: SleepEntry[] }) {
  const [bedtime, setBedtime] = useState(existing?.bedtime ?? "");
  const [wakeTime, setWakeTime] = useState(existing?.wake_time ?? "");
  const [quality, setQuality] = useState(existing?.quality ?? 0);
  const [pending, startTransition] = useTransition();

  const avg = averageDurationMinutes(history);
  const consistency = bedtimeConsistency(history);

  function save() {
    if (!bedtime || !wakeTime) return;
    const duration = computeDuration(bedtime, wakeTime);
    startTransition(async () => {
      await saveSleepEntry({ sleep_date: today, bedtime, wake_time: wakeTime, duration_minutes: duration, quality: quality || null, notes: null });
    });
  }

  return (
    <div className="card space-y-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-text">
        <Moon size={14} /> Sleep
      </p>
      {history.length > 0 && (
        <div className="grid grid-cols-2 gap-3 text-xs text-muted">
          <span>Average: {formatDuration(avg)}</span>
          {consistency !== null && <span>Bedtime varies ~{consistency}min</span>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input value={bedtime} onChange={(e) => setBedtime(e.target.value)} type="time" placeholder="Bedtime" className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent" />
        <input value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} type="time" placeholder="Wake time" className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent" />
      </div>
      <ScaleField label="Sleep quality" value={quality} onChange={setQuality} />
      <button onClick={save} disabled={pending || !bedtime || !wakeTime} className="btn-primary w-full">
        {pending ? "Saving..." : "Log sleep"}
      </button>
    </div>
  );
}
