import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./PageHeader";

/** Shared placeholder for a routed-but-not-yet-built module, per the v2
 * build roadmap's phasing. Keeps the nav item real and navigable now
 * (rather than a dead link) without pretending the module is finished. */
export function ComingSoon({
  icon,
  color,
  eyebrow,
  title,
  phase,
  detail,
}: {
  icon: LucideIcon;
  color: string;
  eyebrow: string;
  title: string;
  phase: string;
  detail: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader icon={icon} color={color} eyebrow={eyebrow} title={title} />
      <div className="card space-y-2 py-10 text-center">
        <p className="text-sm font-medium text-text">{phase}</p>
        <p className="mx-auto max-w-sm text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}
