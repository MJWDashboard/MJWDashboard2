import { createClient } from "@/lib/supabase/server";
import { todaySAST } from "@/lib/taskConstants";

export async function getTodayTasks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("task_date", todaySAST())
    .order("created_at", { ascending: true });
  return data ?? [];
}
