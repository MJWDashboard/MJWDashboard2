import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { DeveloperClient } from "./DeveloperClient";

export const metadata = { title: "Developer" };

export default async function DeveloperPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/today");

  const admin = createServiceRoleClient();
  const [{ data: authUsers }, { data: profiles }, { data: tickets }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.from("profiles").select("id, first_name, last_name, role"),
    admin.from("support_tickets").select("*").order("created_at", { ascending: false }),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const users = (authUsers?.users ?? [])
    .map((u) => {
      const p = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        firstName: p?.first_name ?? null,
        lastName: p?.last_name ?? null,
        role: p?.role ?? "user",
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));

  return <DeveloperClient users={users} tickets={tickets ?? []} />;
}
