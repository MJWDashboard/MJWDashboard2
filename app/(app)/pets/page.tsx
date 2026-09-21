import { createClient } from "@/lib/supabase/server";
import { PetsClient } from "./PetsClient";

export const metadata = { title: "Home & Pets" };

export default async function PetsPage() {
  const supabase = await createClient();

  const [{ data: pets }, { data: careItems }, { data: visits }, { data: assets }] = await Promise.all([
    supabase.from("pets").select("*").order("created_at", { ascending: true }),
    supabase.from("pet_care_items").select("*").order("next_due", { ascending: true }),
    supabase.from("pet_visits").select("*").order("occurred_at", { ascending: false }),
    supabase.from("assets").select("*").order("created_at", { ascending: true }),
  ]);

  return (
    <PetsClient
      pets={pets ?? []}
      careItems={careItems ?? []}
      visits={visits ?? []}
      assets={assets ?? []}
    />
  );
}
