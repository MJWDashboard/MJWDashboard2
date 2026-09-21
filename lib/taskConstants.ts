import { toZonedTime } from "date-fns-tz";
import { SAST } from "@/lib/timezone";

export const TASK_TIERS = ["critical", "important", "admin"] as const;
export type TaskTier = (typeof TASK_TIERS)[number];

/** The ACE rule: one critical, two important, three admin — per day. */
export const TASK_CAPACITY: Record<TaskTier, number> = { critical: 1, important: 2, admin: 3 };

export function todaySAST() {
  return toZonedTime(new Date(), SAST).toISOString().slice(0, 10);
}
