"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import {
  Plus, Trash2, Pencil, Check, X, Pause, Play,
  Droplet, Dumbbell, Footprints, BookOpen, Pill, PenLine, Ban, Moon, Circle,
  type LucideIcon,
} from "lucide-react";
import type { Habit, HabitLog } from "@/lib/habits";
import { isDueOn, currentStreak, bestStreak, completionRate, todayKey } from "@/lib/habits";
import { EmptyState } from "@/components/EmptyState";
import { createHabit, updateHabit, deleteHabit, setHabitActive, logHabit, unlogHabit } from "./actions";

const ICONS: Record<string, LucideIcon> = { Droplet, Dumbbell, Footprints, BookOpen, Pill, PenLine, Ban, Moon, Circle };
const FREQUENCIES = ["daily", "weekdays", "weekly", "monthly", "x_per_week", "custom"] as const;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitsTab({ habits, logs }: { habits: Habit[]; logs: HabitLog[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const active = habits.filter((h) => h.active);
  const paused = habits.filter((h) => !h.active);

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add habit
      </button>

      {active.length === 0 ? (
        <EmptyState icon={Circle} title="No habits yet" detail="Water, exercise, reading, no-spend days — small, trackable things you do regularly." />
      ) : (
        <div className="space-y-2">
          {active.map((habit) => (
            <HabitRow key={habit.id} habit={habit} logs={logs.filter((l) => l.habit_id === habit.id)} onEdit={() => setEditing(habit)} />
          ))}
        </div>
      )}

      {paused.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Paused</p>
          <div className="space-y-2">
            {paused.map((habit) => (
              <PausedHabitRow key={habit.id} habit={habit} />
            ))}
          </div>
        </section>
      )}

      {showForm && <HabitForm onClose={() => setShowForm(false)} />}
      {editing && <HabitForm habit={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function HabitRow({ habit, logs, onEdit }: { habit: Habit; logs: HabitLog[]; onEdit: () => void }) {
  const [, startTransition] = useTransition();
  const Icon = ICONS[habit.icon] ?? Circle;
  const today = todayKey();
  const dueToday = isDueOn(habit, new Date());
  const todayLog = logs.find((l) => l.log_date === today);
  const streak = currentStreak(habit, logs);
  const best = bestStreak(habit, logs);
  const rate7 = completionRate(habit, logs, 7);

  function toggle() {
    startTransition(async () => {
      if (todayLog?.completed) await unlogHabit(habit.id, today);
      else await logHabit(habit.id, today, true);
    });
  }

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button onClick={onEdit} className="flex min-w-0 items-center gap-2 text-left">
          <Icon size={16} className="shrink-0 text-accent" />
          <span className="truncate text-sm text-text">{habit.name}</span>
        </button>
        {dueToday && (
          <button
            onClick={toggle}
            className={clsx(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
              todayLog?.completed ? "border-ok bg-ok text-white" : "border-border text-muted"
            )}
            aria-label="Toggle today"
          >
            <Check size={16} />
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{streak > 0 ? `🔥 ${streak} day streak` : "No streak yet"} · best {best}</span>
        <span>{rate7}% this week</span>
      </div>
    </div>
  );
}

function PausedHabitRow({ habit }: { habit: Habit }) {
  const [, startTransition] = useTransition();
  return (
    <div className="card flex items-center justify-between opacity-60">
      <span className="text-sm text-text">{habit.name}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => startTransition(() => setHabitActive(habit.id, true))} className="text-muted hover:text-text" aria-label="Resume">
          <Play size={14} />
        </button>
        <button onClick={() => startTransition(() => deleteHabit(habit.id))} className="text-muted hover:text-overdue" aria-label="Archive permanently">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function HabitForm({ habit, onClose }: { habit?: Habit; onClose: () => void }) {
  const [name, setName] = useState(habit?.name ?? "");
  const [icon, setIcon] = useState(habit?.icon ?? "Circle");
  const [category, setCategory] = useState(habit?.category ?? "");
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>((habit?.frequency as (typeof FREQUENCIES)[number]) ?? "daily");
  const [weekdays, setWeekdays] = useState<number[]>(habit?.weekdays ?? []);
  const [timesPerWeek, setTimesPerWeek] = useState(habit?.times_per_week?.toString() ?? "3");
  const [target, setTarget] = useState(habit?.target?.toString() ?? "1");
  const [unit, setUnit] = useState(habit?.unit ?? "");
  const [preferredTime, setPreferredTime] = useState(habit?.preferred_time ?? "");
  const [reminder, setReminder] = useState(habit?.reminder ?? false);
  const [pending, startTransition] = useTransition();

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function save() {
    if (!name.trim()) return;
    const fields = {
      name: name.trim(),
      icon,
      category: category.trim() || null,
      frequency,
      weekdays: frequency === "custom" ? weekdays : [],
      times_per_week: frequency === "x_per_week" ? Number(timesPerWeek) : null,
      target: Number(target) || 1,
      unit: unit.trim() || null,
      preferred_time: preferredTime || null,
      reminder,
    };
    startTransition(async () => {
      if (habit) await updateHabit(habit.id, fields);
      else await createHabit(fields);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{habit ? "Edit habit" : "New habit"}</p>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18} /></button>
        </div>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Drink water" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ICONS).map(([name2, Ico]) => (
            <button key={name2} onClick={() => setIcon(name2)} className={clsx("flex h-9 w-9 items-center justify-center rounded-lg border", icon === name2 ? "border-accent bg-accent/10 text-accent" : "border-border text-muted")}>
              <Ico size={16} />
            </button>
          ))}
        </div>

        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />

        <select value={frequency} onChange={(e) => setFrequency(e.target.value as (typeof FREQUENCIES)[number])} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
          {FREQUENCIES.map((f) => <option key={f} value={f}>{f.replace("_", " ")}</option>)}
        </select>

        {frequency === "custom" && (
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, i) => (
              <button key={label} onClick={() => toggleWeekday(i)} className={clsx("rounded-full px-2.5 py-1 text-xs", weekdays.includes(i) ? "bg-accent text-white" : "border border-border text-muted")}>
                {label}
              </button>
            ))}
          </div>
        )}
        {frequency === "x_per_week" && (
          <input value={timesPerWeek} onChange={(e) => setTimesPerWeek(e.target.value)} type="number" placeholder="Times per week" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        )}

        <div className="flex gap-2">
          <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" placeholder="Target" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (e.g. glasses)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        </div>
        <input value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} type="time" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} />
          Remind me
        </label>

        <div className="flex gap-2">
          {habit && (
            <button onClick={() => startTransition(async () => { await setHabitActive(habit.id, false); onClose(); })} className="btn-secondary px-3">
              <Pause size={14} />
            </button>
          )}
          <button onClick={save} disabled={pending} className="btn-primary flex-1">{habit ? "Save changes" : "Save habit"}</button>
        </div>
      </div>
    </div>
  );
}
