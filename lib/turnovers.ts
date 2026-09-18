// Turnover certificates are conventionally due by the 7th of the month
// following the reporting period (e.g. August turnover due 7 September).
export function computeMonthlyDueDate(period: string): string {
  const d = new Date(period);
  const due = new Date(d.getFullYear(), d.getMonth() + 1, 7);
  return due.toISOString().slice(0, 10);
}

export type TurnoverStatus =
  | "outstanding"
  | "due_soon"
  | "due_today"
  | "late"
  | "submitted"
  | "waived"
  | "not_applicable";

export function computeMonthlyStatus(
  dueDate: string | null,
  submitted: boolean,
  manualStatus: string | null
): TurnoverStatus {
  if (manualStatus === "waived" || manualStatus === "not_applicable") return manualStatus;
  if (submitted) return "submitted";
  if (!dueDate) return "outstanding";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "late";
  if (diffDays === 0) return "due_today";
  if (diffDays <= 5) return "due_soon";
  return "outstanding";
}

// Annual certified turnover is conventionally due within 90 days of the
// tenant's financial year end.
export function computeAnnualDueDate(fyeMonth: number, fyeDay: number, financialYear: number): string {
  const fye = new Date(financialYear, fyeMonth - 1, fyeDay);
  const due = new Date(fye);
  due.setDate(due.getDate() + 90);
  return due.toISOString().slice(0, 10);
}

export function computeAnnualStatus(dueDate: string, receivedAt: string | null, manualStatus: string | null): TurnoverStatus {
  if (manualStatus === "not_applicable") return "not_applicable";
  if (receivedAt) return "submitted";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "late";
  if (diffDays <= 14) return "due_soon";
  return "outstanding";
}

export const STATUS_LABELS: Record<TurnoverStatus, string> = {
  outstanding: "Outstanding",
  due_soon: "Due Soon",
  due_today: "Due Today",
  late: "Late",
  submitted: "Submitted",
  waived: "Waived",
  not_applicable: "N/A",
};

export const STATUS_CLASSES: Record<TurnoverStatus, string> = {
  outstanding: "bg-charcoal-600/60 text-charcoal-200",
  due_soon: "bg-yellow-500/20 text-yellow-400",
  due_today: "bg-orange-500/20 text-orange-400",
  late: "bg-red-500/20 text-red-400",
  submitted: "bg-green-500/20 text-green-400",
  waived: "bg-charcoal-600/60 text-charcoal-200",
  not_applicable: "bg-charcoal-600/60 text-charcoal-200",
};

// The financial year that "contains" a given financial-year-end date pair,
// used to figure out which FY label the most recently closed year end is.
export function currentFinancialYear(fyeMonth: number, fyeDay: number): number {
  const today = new Date();
  const fyeThisCalendarYear = new Date(today.getFullYear(), fyeMonth - 1, fyeDay);
  return today >= fyeThisCalendarYear ? today.getFullYear() : today.getFullYear() - 1;
}
