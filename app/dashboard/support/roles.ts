import type { TicketCategory, TicketStatus, TicketPriority } from "./actions";

export const TICKET_CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "fault", label: "Fault (something is broken)" },
  { value: "bug", label: "Bug (the software is misbehaving)" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
];

export const TICKET_CATEGORY_LABEL: Record<TicketCategory, string> = {
  fault: "Fault",
  bug: "Bug",
  question: "Question",
  other: "Other",
};

export const TICKET_STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_STATUS_CLASSES: Record<TicketStatus, string> = {
  open: "bg-charcoal-600/60 text-charcoal-200",
  in_progress: "bg-cyan-600/20 text-cyan-400",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-charcoal-600/60 text-charcoal-400",
};

export const TICKET_PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];
