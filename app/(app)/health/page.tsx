import { HeartPulse } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Health" };

export default function HealthPage() {
  return (
    <ModulePlaceholder
      icon={HeartPulse}
      title="Health"
      phase="Phase 1"
      scope={[
        "Medicine register with daily dose checklist",
        "Monthly collection cycle and stock countdown",
        "Appointments and weight trend",
      ]}
    />
  );
}
