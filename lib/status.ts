export const RECORD_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  waiting_on_feedback: "Waiting on Feedback",
  complete: "Complete",
};

export const RECORD_STATUS_CLASSES: Record<string, string> = {
  not_started: "bg-charcoal-600/60 text-charcoal-200",
  in_progress: "bg-cyan-600/20 text-cyan-400",
  waiting_on_feedback: "bg-yellow-500/20 text-yellow-400",
  complete: "bg-green-500/20 text-green-400",
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return RECORD_STATUS_LABELS[status] ?? status;
}

export function statusClasses(status: string | null | undefined): string {
  if (!status) return "bg-charcoal-600/60 text-charcoal-200";
  return RECORD_STATUS_CLASSES[status] ?? "bg-charcoal-600/60 text-charcoal-200";
}

export const PRIORITY_CLASSES: Record<string, string> = {
  low: "bg-charcoal-600/60 text-charcoal-200",
  medium: "bg-cyan-600/20 text-cyan-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

export const LEASE_STATUS_CLASSES: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  expired: "bg-red-500/20 text-red-400",
  terminated: "bg-red-500/20 text-red-400",
  pending: "bg-charcoal-600/60 text-charcoal-200",
  renewal_in_progress: "bg-cyan-600/20 text-cyan-400",
};

export const LEASING_STAGE_CLASSES: Record<string, string> = {
  enquiry: "bg-charcoal-600/60 text-charcoal-200",
  offer: "bg-cyan-600/20 text-cyan-400",
  negotiation: "bg-yellow-500/20 text-yellow-400",
  signed: "bg-green-500/20 text-green-400",
  declined: "bg-red-500/20 text-red-400",
  withdrawn: "bg-red-500/20 text-red-400",
};

function titleCase(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function enumLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return titleCase(value);
}

export const MEETING_STATUS_CLASSES: Record<string, string> = {
  draft: "bg-charcoal-600/60 text-charcoal-200",
  scheduled: "bg-cyan-600/20 text-cyan-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  archived: "bg-charcoal-600/60 text-charcoal-400",
};

export const RISK_SEVERITY_CLASSES: Record<string, string> = {
  low: "bg-charcoal-600/60 text-charcoal-200",
  medium: "bg-cyan-600/20 text-cyan-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

export const VACANT_UNIT_STATUS_CLASSES: Record<string, string> = {
  vacant: "bg-yellow-500/20 text-yellow-400",
  under_offer: "bg-cyan-600/20 text-cyan-400",
  leased: "bg-green-500/20 text-green-400",
};

export const LEASING_TARGET_STATUS_CLASSES: Record<string, string> = {
  to_approach: "bg-charcoal-600/60 text-charcoal-200",
  contacted: "bg-cyan-600/20 text-cyan-400",
  meeting_set: "bg-cyan-600/20 text-cyan-400",
  interested: "bg-yellow-500/20 text-yellow-400",
  not_interested: "bg-red-500/20 text-red-400",
  converted: "bg-green-500/20 text-green-400",
};
