import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { isPlatformAdmin } from "@/lib/supabase/platformAdmin";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/StatusBadge";
import { PRIORITY_CLASSES } from "@/lib/status";
import { formatDateTime } from "@/lib/format";
import { TICKET_CATEGORY_LABEL } from "../roles";
import { TicketThreadPanel } from "./TicketThreadPanel";
import type { TicketStatus } from "../actions";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select(
      "id, ticket_number, category, subject, description, status, priority, created_at, reported_by, assigned_to, buildings(name)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!ticket) notFound();

  const [{ data: comments }, { data: emailRows }, canManage] = await Promise.all([
    supabase
      .from("support_ticket_comments")
      .select("id, author_id, body, created_at")
      .eq("ticket_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.rpc("org_member_emails"),
    isPlatformAdmin(supabase, user.id),
  ]);

  const emailByUserId = new Map((emailRows ?? []).map((r: any) => [r.user_id, r.email]));
  const canEditStatus = canManage || ticket.assigned_to === user.id || ticket.reported_by === user.id;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`${ticket.ticket_number} — ${ticket.subject}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge label={TICKET_CATEGORY_LABEL[ticket.category as keyof typeof TICKET_CATEGORY_LABEL] ?? ticket.category} className="bg-charcoal-600/60 text-charcoal-200" />
            <Badge label={ticket.priority} className={`capitalize ${PRIORITY_CLASSES[ticket.priority] ?? ""}`} />
            {(ticket.buildings as any)?.name && <span>{(ticket.buildings as any).name}</span>}
          </span>
        }
      />

      <Link href="/dashboard/support" className="mb-4 inline-block text-xs text-charcoal-400 hover:text-charcoal-200">
        ← Back to Support Tickets
      </Link>

      <div className="card mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-charcoal-300">
          <div>
            Reported by <span className="text-charcoal-100">{emailByUserId.get(ticket.reported_by) ?? "—"}</span>
          </div>
          <div className="text-xs text-charcoal-400">{formatDateTime(ticket.created_at)}</div>
        </div>
        {ticket.description && (
          <p className="whitespace-pre-wrap text-sm text-charcoal-200">{ticket.description}</p>
        )}
      </div>

      <TicketThreadPanel
        ticketId={ticket.id}
        status={ticket.status as TicketStatus}
        canEditStatus={canEditStatus}
        comments={(comments ?? []).map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.created_at,
          authorEmail: emailByUserId.get(c.author_id) ?? c.author_id,
          isMe: c.author_id === user.id,
        }))}
      />
    </div>
  );
}
