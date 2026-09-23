import type { Tables } from "@/lib/supabase/database.types";

export type Habit = Tables<"habits">;
export type HabitLog = Tables<"habit_logs">;

function toDateOnly(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Whether a habit is "due" on a given date, per its frequency. Weekly,
 * monthly and x-times-per-week habits don't have a single due day — they're
 * due "at some point in the period", so isDueToday only applies cleanly to
 * daily/weekdays/custom; the others fall back to always-due, and their
 * progress is read as a completion count against the period instead. */
export function isDueOn(habit: Habit, date: Date): boolean {
  if (!habit.active) return false;
  if (date < toDateOnly(new Date(habit.start_date))) return false;
  const dow = date.getDay();
  switch (habit.frequency) {
    case "daily":
      return true;
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "custom":
      return habit.weekdays.includes(dow);
    case "weekly":
    case "monthly":
    case "x_per_week":
      return true;
    default:
      return true;
  }
}

/** Current streak: consecutive due-days, walking back from today, that have
 * a completed log. A non-due day is skipped (doesn't break the streak). */
export function currentStreak(habit: Habit, logs: HabitLog[]): number {
  const logsByDate = new Map(logs.map((l) => [l.log_date, l]));
  let streak = 0;
  const cursor = toDateOnly(new Date());

  for (let i = 0; i < 3650; i++) {
    if (cursor < toDateOnly(new Date(habit.start_date))) break;
    const key = cursor.toISOString().slice(0, 10);
    if (isDueOn(habit, cursor)) {
      const log = logsByDate.get(key);
      if (log?.completed) streak += 1;
      else break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function bestStreak(habit: Habit, logs: HabitLog[]): number {
  const completedDates = logs.filter((l) => l.completed).map((l) => l.log_date).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;

  for (const dateStr of completedDates) {
    const d = new Date(dateStr);
    if (prev) {
      const cursor = new Date(prev);
      cursor.setDate(cursor.getDate() + 1);
      let bridgesNonDueOnly = true;
      while (cursor < d) {
        if (isDueOn(habit, cursor)) {
          bridgesNonDueOnly = false;
          break;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      run = bridgesNonDueOnly ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Completion % over the trailing N days, counted against due-days only. */
export function completionRate(habit: Habit, logs: HabitLog[], days: number): number {
  const logsByDate = new Map(logs.map((l) => [l.log_date, l]));
  const cursor = toDateOnly(new Date());
  let due = 0;
  let done = 0;

  for (let i = 0; i < days; i++) {
    if (cursor >= toDateOnly(new Date(habit.start_date)) && isDueOn(habit, cursor)) {
      due += 1;
      const log = logsByDate.get(cursor.toISOString().slice(0, 10));
      if (log?.completed) done += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return due > 0 ? Math.round((done / due) * 100) : 0;
}

export function todayKey() {
  return toDateOnly(new Date()).toISOString().slice(0, 10);
}
