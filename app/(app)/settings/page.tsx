import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user!.id)
    .single();

  return (
    <SettingsClient
      email={user?.email ?? ""}
      firstName={profile?.first_name ?? ""}
      lastName={profile?.last_name ?? ""}
      isAdmin={profile?.role === "admin"}
    />
  );
}
