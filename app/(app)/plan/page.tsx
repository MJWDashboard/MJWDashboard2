import { PageHeader } from "@/components/PageHeader";
import { ListTodo } from "lucide-react";
import { getTasksForView, getCapacityForToday, type PlanView } from "@/lib/planTasks";
import { PlanClient } from "./PlanClient";

export const metadata = { title: "Plan" };

const VALID_VIEWS: PlanView[] = ["today", "tomorrow", "week", "month", "upcoming", "backlog"];

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const params = await searchParams;
  const view = VALID_VIEWS.includes(params.view as PlanView) ? (params.view as PlanView) : "today";

  const [tasks, capacity] = await Promise.all([
    getTasksForView(view),
    view === "today" ? getCapacityForToday() : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader icon={ListTodo} color="#0FAE9C" eyebrow="Time & Tasks" title="Plan" />
      <PlanClient view={view} initialTasks={tasks} capacity={capacity} />
    </div>
  );
}
