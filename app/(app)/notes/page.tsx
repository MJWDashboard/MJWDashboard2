import { StickyNote } from "lucide-react";
import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Notes & Lists" };

export default function NotesPage() {
  return (
    <ModulePlaceholder
      icon={StickyNote}
      title="Notes & Lists"
      phase="Phase 1"
      scope={["Markdown notes with folders, tags and search", "Shopping lists grouped by aisle, usable offline in store"]}
    />
  );
}
