import { createClient } from "@/lib/supabase/server";
import { VehicleClient } from "./VehicleClient";

export const metadata = { title: "Vehicle & Travel" };

export default async function VehiclePage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: fuelLogs }, { data: trips }, { data: services }] = await Promise.all([
    supabase.from("vehicles").select("*").order("created_at", { ascending: true }),
    supabase.from("fuel_logs").select("*").order("occurred_at", { ascending: false }),
    supabase.from("trips").select("*").order("occurred_at", { ascending: false }),
    supabase.from("services").select("*").order("occurred_at", { ascending: false }),
  ]);

  return (
    <VehicleClient
      vehicles={vehicles ?? []}
      fuelLogs={fuelLogs ?? []}
      trips={trips ?? []}
      services={services ?? []}
    />
  );
}
