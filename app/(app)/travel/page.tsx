import { createClient } from "@/lib/supabase/server";
import { TravelClient } from "./TravelClient";

export const metadata = { title: "Travel" };

export default async function TravelPage() {
  const supabase = await createClient();

  const [{ data: trips }, { data: items }] = await Promise.all([
    supabase.from("travel_trips").select("*").order("start_date", { ascending: true, nullsFirst: false }),
    supabase.from("travel_items").select("*").order("position", { ascending: true }),
  ]);

  return <TravelClient trips={trips ?? []} items={items ?? []} />;
}
