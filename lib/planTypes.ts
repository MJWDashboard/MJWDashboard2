import { toZonedTime } from "date-fns-tz";
import type { Tables } from "@/lib/supabase/database.types";
import { SAST } from "@/lib/timezone";

/** Types and pure helpers shared between server data-fetchers
 * (lib/planTasks.ts) and client components (Plan/Today UI) — kept apart
 * from lib/planTasks.ts because that file imports the server-only Supabase
 * client and can't be pulled into a client bundle. */
export type Task = Tables<"tasks">;
export type PlanView = "today" | "tomorrow" | "week" | "month" | "upcoming" | "backlog";

export const PRIORITY_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  normal: "Normal",
  low: "Low",
};
export const STATUS_LABEL: Record<string, string> = {
  inbox: "Inbox",
  planned: "Planned",
  in_progress: "In Progress",
  waiting: "Waiting",
  complete: "Complete",
  cancelled: "Cancelled",
};

export function todaySAST() {
  return toZonedTime(new Date(), SAST).toISOString().slice(0, 10);
}
