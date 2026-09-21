import { type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-8 text-center">
      <Icon className="text-muted" size={24} />
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="max-w-xs text-xs text-muted">{detail}</p>
    </div>
  );
}
