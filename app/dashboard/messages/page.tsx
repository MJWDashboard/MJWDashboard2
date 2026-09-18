import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { getManagedPortfolioIds } from "@/lib/supabase/teamAccess";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge, Badge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { NewMessageButton } from "./NewMessageForm";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const userId = user.id;

  const supabase = createClient();
  const managedPortfolioIds = await getManagedPortfolioIds(supabase, user);

  const [{ data: messages }, { data: reads }, { data: emailRows }] = await Promise.all([
    supabase
      .from("team_messages")
      .select("id, type, subject, status, due_date, updated_at, assigned_to, created_by, portfolios(name), buildings(name)")
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase.from("team_message_reads").select("message_id, last_read_at").eq("user_id", userId),
    supabase.rpc("org_member_emails"),
  ]);

  const emailByUserId = new Map((emailRows ?? []).map((r: any) => [r.user_id, r.email]));
  const readAt = new Map((reads ?? []).map((r) => [r.message_id, r.last_read_at]));
  const isUnread = (m: any) => {
    const lastRead = readAt.get(m.id);
    return !lastRead || new Date(lastRead) < new Date(m.updated_at);
  };

  const assignedToMe = (messages ?? []).filter((m: any) => m.assigned_to === userId);
  const sentByMe = (messages ?? []).filter((m: any) => m.created_by === userId && m.assigned_to !== userId);

  let formData: { portfolios: any[]; buildings: any[]; members: any[]; emails: Record<string, string> } | null = null;
  if (managedPortfolioIds.length > 0) {
    const [{ data: portfolios }, { data: buildings }, { data: members }] = await Promise.all([
      supabase.from("portfolios").select("id, name").in("id", managedPortfolioIds).order("name"),
      supabase.from("buildings").select("id, name, portfolio_id").in("portfolio_id", managedPortfolioIds).order("name"),
      supabase.from("portfolio_users").select("id, user_id, portfolio_id, role").in("portfolio_id", managedPortfolioIds),
    ]);
    formData = {
      portfolios: portfolios ?? [],
      buildings: buildings ?? [],
      members: members ?? [],
      emails: Object.fromEntries(emailByUserId),
    };
  }

  function Row({ m }: { m: any }) {
    return (
      <tr>
        <td>
          <Link href={`/dashboard/messages/${m.id}`} className="flex items-center gap-2 hover:text-cyan-400">
            {isUnread(m) && <span className="h-2 w-2 flex-none rounded-full bg-cyan-400" aria-label="Unread" />}
            <span className={isUnread(m) ? "font-semibold text-charcoal-100" : ""}>{m.subject}</span>
          </Link>
        </td>
        <td>
          <Badge
            label={m.type === "task" ? "Task" : "Message"}
            className={m.type === "task" ? "bg-orange-500/20 text-orange-400" : "bg-cyan-600/20 text-cyan-400"}
          />
        </td>
        <td className="text-charcoal-300">
          {m.portfolios?.name ?? "—"}
          {m.buildings?.name ? ` · ${m.buildings.name}` : ""}
        </td>
        <td>
          {m.assigned_to === userId
            ? `From ${emailByUserId.get(m.created_by) ?? "—"}`
            : `To ${emailByUserId.get(m.assigned_to) ?? "—"}`}
        </td>
        <td>
          <StatusBadge status={m.status} />
        </td>
        <td>{m.due_date ? formatDate(m.due_date) : "—"}</td>
      </tr>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tasks & Messages"
        description="Tasks and messages assigned to you, and ones you've sent"
        action={formData ? <NewMessageButton {...formData} /> : undefined}
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-charcoal-100">Assigned to Me</h2>
          {assignedToMe.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Portfolio / Building</th>
                    <th>From</th>
                    <th>Status</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedToMe.map((m: any) => (
                    <Row key={m.id} m={m} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Nothing assigned to you right now" />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-charcoal-100">Sent by Me</h2>
          {sentByMe.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Portfolio / Building</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {sentByMe.map((m: any) => (
                    <Row key={m.id} m={m} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="You haven't sent any tasks or messages yet" />
          )}
        </section>
      </div>
    </div>
  );
}
