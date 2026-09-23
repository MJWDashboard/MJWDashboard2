import { createClient } from "@/lib/supabase/server";
import { LifeAdminClient } from "./LifeAdminClient";

export const metadata = { title: "Life Admin" };

export default async function LifeAdminPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("life_admin_items")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  return <LifeAdminClient items={items ?? []} />;
}
