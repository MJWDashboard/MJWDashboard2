import { toZonedTime } from "date-fns-tz";
import { SAST } from "./timezone";

/** Next occurrence (in SAST) of a yearly/monthly recurring date, on/after today. */
export function nextOccurrence(recurrence: "yearly" | "monthly", month: number | null, day: number) {
  const now = toZonedTime(new Date(), SAST);
  now.setHours(0, 0, 0, 0);
  const year = now.getFullYear();

  if (recurrence === "monthly") {
    let candidate = new Date(year, now.getMonth(), day);
    if (candidate < now) candidate = new Date(year, now.getMonth() + 1, day);
    return candidate;
  }

  const m = (month ?? 1) - 1;
  let candidate = new Date(year, m, day);
  if (candidate < now) candidate = new Date(year + 1, m, day);
  return candidate;
}

export function daysUntil(date: Date) {
  const now = toZonedTime(new Date(), SAST);
  now.setHours(0, 0, 0, 0);
  const diff = date.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/** Every occurrence of a yearly/monthly recurring date that falls within
 * [rangeStart, rangeEnd] — for rendering a month/week grid, as opposed to
 * nextOccurrence's single "what's coming up" answer. */
export function occurrencesInRange(
  recurrence: "yearly" | "monthly",
  month: number | null,
  day: number,
  rangeStart: Date,
  rangeEnd: Date
) {
  const results: Date[] = [];
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);

  while (cursor <= rangeEnd) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    if (recurrence === "monthly" || (recurrence === "yearly" && (month ?? 1) - 1 === m)) {
      const candidate = new Date(y, m, day);
      if (candidate.getMonth() === m && candidate >= rangeStart && candidate <= rangeEnd) {
        results.push(candidate);
      }
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return results;
}
