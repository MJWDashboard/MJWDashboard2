import { PawPrint } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Home & Pets" };

export default function PetsPage() {
  return (
    <ModulePlaceholder
      icon={PawPrint}
      title="Home & Pets"
      phase="Phase 3"
      scope={["Prince and Tigger profiles with senior-dog fields", "Vaccine, deworming and flea schedules", "Vet visit log with the Garth settle-up split", "Asset register with warranties"]}
    />
  );
}
