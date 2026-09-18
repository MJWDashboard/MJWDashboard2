import { statusClasses, statusLabel } from "@/lib/status";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
