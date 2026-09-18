import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { isPlatformAdmin } from "@/lib/supabase/platformAdmin";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatDateTime } from "@/lib/format";

export default async function SystemHealthPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");

  const supabase = createClient();
  const isAdmin = await isPlatformAdmin(supabase, user.id);
  const isOrgAdmin = user.role === "admin";
  if (!isAdmin && !isOrgAdmin) redirect("/dashboard");

  const { data: errors } = await supabase
    .from("app_errors")
    .select("id, message, stack, url, user_id, context, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: emailRows } = await supabase.rpc("org_member_emails");
  const emailByUserId = new Map((emailRows ?? []).map((r: any) => [r.user_id, r.email]));

  return (
    <div>
      <PageHeader
        title="System Health"
        description="Errors captured from the live app, most recent first"
      />

      {errors && errors.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Message</th>
                <th>Page</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e: any) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap text-charcoal-300">{formatDateTime(e.created_at)}</td>
                  <td className="text-charcoal-100">{e.user_id ? emailByUserId.get(e.user_id) ?? "Signed in" : "Not signed in"}</td>
                  <td className="max-w-md truncate text-charcoal-200" title={e.message}>
                    {e.message}
                  </td>
                  <td className="max-w-xs truncate text-xs text-charcoal-400" title={e.url ?? undefined}>
                    {e.url ? new URL(e.url).pathname : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No errors captured yet" description="That's a good sign." />
      )}
    </div>
  );
}
