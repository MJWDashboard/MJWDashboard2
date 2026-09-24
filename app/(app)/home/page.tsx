import { createClient } from "@/lib/supabase/server";
import { HomeClient } from "./HomeClient";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: maintenance }, { data: contacts }, { data: bills }] = await Promise.all([
    supabase.from("home_maintenance").select("*").order("date_reported", { ascending: false }),
    supabase.from("home_contacts").select("*").order("name", { ascending: true }),
    supabase
      .from("recurring_expenses")
      .select("id, provider, amount, frequency, next_due_date, active")
      .eq("active", true)
      .order("next_due_date", { ascending: true }),
  ]);

  return (
    <HomeClient
      maintenance={maintenance ?? []}
      contacts={contacts ?? []}
      bills={bills ?? []}
    />
  );
}
