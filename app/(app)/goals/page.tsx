import { createClient } from "@/lib/supabase/server";
import { GoalsClient } from "./GoalsClient";

export const metadata = { title: "Goals" };

export default async function GoalsPage() {
  const supabase = await createClient();

  const [{ data: goals }, { data: milestones }, { data: savingsGoals }, { data: taskCounts }, { data: habitCounts }] = await Promise.all([
    supabase.from("goals").select("*").order("created_at", { ascending: true }),
    supabase.from("goal_milestones").select("*").order("position", { ascending: true }),
    supabase.from("savings_goals").select("id, title, current_amount, target_amount"),
    supabase.from("tasks").select("id, goal_id, status").not("goal_id", "is", null),
    supabase.from("habits").select("id, goal_id").not("goal_id", "is", null),
  ]);

  return (
    <GoalsClient
      goals={goals ?? []}
      milestones={milestones ?? []}
      savingsGoals={savingsGoals ?? []}
      linkedTasks={taskCounts ?? []}
      linkedHabits={habitCounts ?? []}
    />
  );
}
