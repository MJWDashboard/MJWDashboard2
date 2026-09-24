import type { Tables } from "@/lib/supabase/database.types";

export type SleepEntry = Tables<"sleep_entries">;

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Bedtime/wake time -> duration in minutes, handling overnight wrap
 * (bedtime 23:00 -> wake 07:00 = 8h, not a negative span). */
export function computeDuration(bedtime: string, wakeTime: string): number {
  const bed = timeToMinutes(bedtime);
  const wake = timeToMinutes(wakeTime);
  return wake > bed ? wake - bed : 24 * 60 - bed + wake;
}

export function averageDurationMinutes(entries: SleepEntry[]): number {
  const withDuration = entries.filter((e) => e.duration_minutes != null);
  if (withDuration.length === 0) return 0;
  return Math.round(withDuration.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0) / withDuration.length);
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/** Bedtime consistency: standard deviation of bedtime (in minutes from
 * midnight) across entries — lower is more consistent. Returned in minutes
 * so it reads naturally ("bedtime varies by ~23 min"). */
export function bedtimeConsistency(entries: SleepEntry[]): number | null {
  const times = entries.filter((e) => e.bedtime).map((e) => timeToMinutes(e.bedtime!));
  if (times.length < 2) return null;
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;
  return Math.round(Math.sqrt(variance));
}
