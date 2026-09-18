import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { isPlatformAdmin } from "@/lib/supabase/platformAdmin";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/StatusBadge";
import { PRIORITY_CLASSES } from "@/lib/status";
import { formatDateTime } from "@/lib/format";
import { TICKET_STATUS_LABEL, TICKET_STATUS_CLASSES, TICKET_CATEGORY_LABEL } from "./roles";
import { NewTicketButton } from "./NewTicketForm";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();
  const [isAdmin, { data: buildings }, { data: tickets }, { data: emailRows }] = await Promise.all([
    isPlatformAdmin(supabase, user.id),
    supabase.from("buildings").select("id, name").order("name"),
    supabase
      .from("support_tickets")
      .select("id, ticket_number, category, subject, status, priority, created_at, reported_by, assigned_to, buildings(name)")
      .order("created_at", { ascending: false }),
    supabase.rpc("org_member_emails"),
  ]);

  const emailByUserId = new Map((emailRows ?? []).map((r: any) => [r.user_id, r.email]));
  const myTickets = (tickets ?? []).filter((t: any) => t.reported_by === user.id);
  const bucketTickets = isAdmin ? tickets ?? [] : [];

  function TicketRow({ t, showReporter }: { t: any; showReporter: boolean }) {
    return (
      <tr>
        <td>
          <Link href={`/dashboard/support/${t.id}`} className="text-charcoal-100 hover:text-cyan-400">
            {t.ticket_number}
          </Link>
        </td>
        <td className="text-charcoal-200">{t.subject}</td>
        <td>
          <Badge label={TICKET_CATEGORY_LABEL[t.category as keyof typeof TICKET_CATEGORY_LABEL] ?? t.category} className="bg-charcoal-600/60 text-charcoal-200" />
        </td>
        {showReporter && <td className="text-charcoal-300">{emailByUserId.get(t.reported_by) ?? "—"}</td>}
        <td className="text-charcoal-300">{t.buildings?.name ?? "—"}</td>
        <td>
          <Badge label={t.priority} className={`capitalize ${PRIORITY_CLASSES[t.priority] ?? ""}`} />
        </td>
        <td>
          <Badge label={TICKET_STATUS_LABEL[t.status as keyof typeof TICKET_STATUS_LABEL] ?? t.status} className={TICKET_STATUS_CLASSES[t.status as keyof typeof TICKET_STATUS_CLASSES] ?? ""} />
        </td>
        <td>{formatDateTime(t.created_at)}</td>
      </tr>
    );
  }

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        description="Report a fault or a bug - every ticket gets a number and is tracked for accountability"
        action={<NewTicketButton buildings={buildings ?? []} />}
      />

      <div className="space-y-8">
        {isAdmin && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-charcoal-100">All Tickets (Developer Bucket)</h2>
            {bucketTickets.length > 0 ? (
              <div className="table-shell">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Ticket #</th>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Reported By</th>
                      <th>Building</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bucketTickets.map((t: any) => (
                      <TicketRow key={t.id} t={t} showReporter />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No tickets logged yet" />
            )}
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-charcoal-100">My Tickets</h2>
          {myTickets.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Building</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {myTickets.map((t: any) => (
                    <TicketRow key={t.id} t={t} showReporter={false} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="You haven't logged any tickets" />
          )}
        </section>
      </div>
    </div>
  );
}
