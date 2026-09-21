import { createClient } from "@/lib/supabase/server";
import { VehicleClient } from "./VehicleClient";

export const metadata = { title: "Vehicle & Travel" };

export default async function VehiclePage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: fuelLogs }, { data: trips }, { data: services }, { data: receipts }] =
    await Promise.all([
      supabase.from("vehicles").select("*").order("created_at", { ascending: true }),
      supabase.from("fuel_logs").select("*").order("occurred_at", { ascending: false }),
      supabase.from("trips").select("*").order("occurred_at", { ascending: false }),
      supabase.from("services").select("*").order("occurred_at", { ascending: false }),
      supabase.from("attachments").select("*").eq("record_table", "fuel_logs"),
    ]);

  return (
    <VehicleClient
      vehicles={vehicles ?? []}
      fuelLogs={fuelLogs ?? []}
      trips={trips ?? []}
      services={services ?? []}
      receipts={receipts ?? []}
    />
  );
}
