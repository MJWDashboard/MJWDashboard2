import { type LucideIcon } from "lucide-react";

export function ModulePlaceholder({
  icon: Icon,
  title,
  phase,
  scope,
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
  scope: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{phase}</p>
        <h1 className="text-lg font-semibold text-text">{title}</h1>
      </div>
      <div className="card flex flex-col items-center gap-3 py-10 text-center">
        <Icon className="text-accent" size={28} />
        <p className="text-sm font-medium text-text">Coming in {phase}</p>
        <ul className="space-y-1 text-xs text-muted">
          {scope.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
