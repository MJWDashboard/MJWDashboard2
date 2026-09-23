import { LineChart } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <ComingSoon
      icon={LineChart}
      color="#0FAE9C"
      eyebrow="Intelligence"
      title="Insights"
      phase="Coming in Phase 5 — Intelligence"
      detail="Short, factual, actionable observations across money, time, habits and vehicle costs — plus the Weekly and Monthly Review. No generic motivational content."
    />
  );
}
