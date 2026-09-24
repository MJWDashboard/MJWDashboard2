export type LifeAdminUrgency = "complete" | "expired" | "action_required" | "due_soon" | "current";

function daysUntil(dateStr: string, today: Date) {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

/** Urgency is computed live from due_date + lead_days rather than trusting
 * the stored `status` column, so it never drifts stale between visits — the
 * same approach as lib/watchlist.ts. The stored status is only used to
 * record a manual "complete". */
export function computeUrgency(
  status: string,
  dueDate: string | null,
  leadDays: number[],
  today: Date = new Date()
): LifeAdminUrgency {
  if (status === "complete") return "complete";
  if (!dueDate) return "current";
  today.setHours(0, 0, 0, 0);
  const days = daysUntil(dueDate, today);
  if (days < 0) return "expired";
  const sorted = [...leadDays].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  const innermost = sorted[0] ?? 7;
  const outermost = sorted[sorted.length - 1] ?? 30;
  if (days <= innermost) return "action_required";
  if (days <= outermost) return "due_soon";
  return "current";
}

export const CATEGORY_LABEL: Record<string, string> = {
  passport: "Passport",
  drivers_licence: "Driver's licence",
  vehicle_licence: "Vehicle licence",
  insurance: "Insurance",
  warranty: "Warranty",
  membership: "Membership",
  contract: "Contract",
  subscription: "Subscription",
  tax: "Tax",
  policy_review: "Policy review",
  anniversary: "Anniversary",
  document: "Document",
  other: "Other",
};

export const URGENCY_LABEL: Record<LifeAdminUrgency, string> = {
  complete: "Complete",
  expired: "Expired",
  action_required: "Action needed",
  due_soon: "Due soon",
  current: "Current",
};
