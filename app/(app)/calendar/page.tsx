import { createClient } from "@/lib/supabase/server";
import { CalendarClient } from "./CalendarClient";

export const metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const supabase = await createClient();

  const [{ data: events }, { data: importantDates }] = await Promise.all([
    supabase.from("events").select("*").order("starts_at", { ascending: true }),
    supabase.from("important_dates").select("*").order("day", { ascending: true }),
  ]);

  return <CalendarClient initialEvents={events ?? []} initialImportantDates={importantDates ?? []} />;
}
