import type { LucideIcon } from "lucide-react";

export function PageHeader({
  icon: Icon,
  color,
  eyebrow,
  title,
}: {
  icon: LucideIcon;
  color: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${color}22`, color }}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
        <h1 className="text-xl font-semibold text-text">{title}</h1>
      </div>
    </div>
  );
}
