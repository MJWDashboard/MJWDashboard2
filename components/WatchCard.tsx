import Link from "next/link";
import { clsx } from "clsx";
import type { WatchlistItem } from "@/lib/watchlist";

const SEVERITY_LABEL: Record<string, string> = { soon: "Soon", overdue: "Overdue" };
const SEVERITY_CLASS: Record<string, string> = {
  soon: "status-pill-soon",
  overdue: "status-pill-overdue",
};

export function WatchCard({ reminder }: { reminder: WatchlistItem }) {
  return (
    <Link href={reminder.href} className="card flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">{reminder.title}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          {reminder.due_at && <span>{new Date(reminder.due_at).toLocaleDateString("en-ZA")}</span>}
          {reminder.amount_at_risk != null && (
            <span data-sensitive className="tabular">
              R{Number(reminder.amount_at_risk).toLocaleString("en-ZA")}
            </span>
          )}
        </div>
      </div>
      <span className={clsx(SEVERITY_CLASS[reminder.severity])}>{SEVERITY_LABEL[reminder.severity]}</span>
    </Link>
  );
}
