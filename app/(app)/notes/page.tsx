import { createClient } from "@/lib/supabase/server";
import { NotesListsClient } from "./NotesListsClient";

export const metadata = { title: "Notes & Lists" };

export default async function NotesPage() {
  const supabase = await createClient();

  const [{ data: notes }, { data: lists }, { data: items }] = await Promise.all([
    supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false }),
    supabase.from("lists").select("*").order("created_at", { ascending: true }),
    supabase.from("list_items").select("*").order("position", { ascending: true }),
  ]);

  return (
    <NotesListsClient
      initialNotes={notes ?? []}
      initialLists={lists ?? []}
      initialItems={items ?? []}
    />
  );
}
