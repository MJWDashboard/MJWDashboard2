import { Plane } from "lucide-react";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Travel" };

export default function TravelPage() {
  return (
    <ComingSoon
      icon={Plane}
      color="#0FAE9C"
      eyebrow="Life"
      title="Travel"
      phase="Coming in Phase 4 — Life Management"
      detail="Trips with dates, bookings, itinerary, budget and documents — automatically surfaced on Today as the trip approaches."
    />
  );
}
