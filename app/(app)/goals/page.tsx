import { Target } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Goals" };

export default function GoalsPage() {
  return (
    <ComingSoon
      icon={Target}
      color="#0FAE9C"
      eyebrow="Life Planning"
      title="Goals"
      phase="Coming in Phase 4 — Life Management"
      detail="Personal, financial, wellness and career goals, each with milestones and a visible next action, linked to the tasks and habits that move them forward."
    />
  );
}
