import { Car } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Vehicle & Travel" };

export default function VehiclePage() {
  return (
    <ModulePlaceholder
      icon={Car}
      title="Vehicle & Travel"
      phase="Phase 3"
      scope={["Vehicle register with owner/financier/driver/payer", "Fuel log with cost per km", "Trip log built to SARS logbook fields", "Service and licence reminders"]}
    />
  );
}
