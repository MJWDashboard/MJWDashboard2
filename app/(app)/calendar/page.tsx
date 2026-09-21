import { CalendarDays } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <ModulePlaceholder
      icon={CalendarDays}
      title="Calendar & Dates"
      phase="Phase 1"
      scope={["Two-way Google Calendar sync", "Important dates with reminder ladders", "Evening transport-needed flag"]}
    />
  );
}
