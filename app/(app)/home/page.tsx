import { House } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Home" };

export default function HomePage() {
  return (
    <ComingSoon
      icon={House}
      color="#0FAE9C"
      eyebrow="Life"
      title="Home"
      phase="Coming in Phase 4 — Life Management"
      detail="Utilities, service providers, maintenance, warranties and household costs in one register, feeding Today when something needs attention."
    />
  );
}
