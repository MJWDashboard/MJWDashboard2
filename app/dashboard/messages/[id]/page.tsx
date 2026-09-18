import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, Badge } from "@/components/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/format";
import { markMessageRead } from "../actions";
import { ThreadPanel } from "./ThreadPanel";

export default async function MessageThreadPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = createClient();

  const { data: message } = await supabase
    .from("team_messages")
    .select(
      "id, type, subject, body, status, due_date, created_at, assigned_to, created_by, portfolio_id, portfolios(name), buildings(name)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!message) notFound();

  const [{ data: replies }, { data: emailRows }] = await Promise.all([
    supabase
      .from("team_message_replies")
      .select("id, author_id, body, created_at")
      .eq("message_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.rpc("org_member_emails"),
  ]);

  await markMessageRead(params.id);

  const emailByUserId = new Map((emailRows ?? []).map((r: any) => [r.user_id, r.email]));
  const canEditStatus = message.assigned_to === user.id || message.created_by === user.id;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={message.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge
              label={message.type === "task" ? "Task" : "Message"}
              className={
                message.type === "task"
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-cyan-600/20 text-cyan-400"
              }
            />
            <span>
              {(message.portfolios as any)?.name ?? "—"}
              {(message.buildings as any)?.name ? ` · ${(message.buildings as any).name}` : ""}
            </span>
          </span>
        }
      />

      <Link href="/dashboard/messages" className="mb-4 inline-block text-xs text-charcoal-400 hover:text-charcoal-200">
        ← Back to Tasks & Messages
      </Link>

      <div className="card mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-charcoal-300">
          <div>
            From <span className="text-charcoal-100">{emailByUserId.get(message.created_by) ?? "—"}</span>
            {" · "}To <span className="text-charcoal-100">{emailByUserId.get(message.assigned_to) ?? "—"}</span>
          </div>
          <div className="text-xs text-charcoal-400">{formatDateTime(message.created_at)}</div>
        </div>
        {message.body && <p className="whitespace-pre-wrap text-sm text-charcoal-200">{message.body}</p>}
        {message.due_date && (
          <p className="text-xs text-charcoal-400">Due {formatDate(message.due_date)}</p>
        )}
      </div>

      <ThreadPanel
        messageId={message.id}
        status={message.status}
        canEditStatus={canEditStatus}
        replies={(replies ?? []).map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: r.created_at,
          authorEmail: emailByUserId.get(r.author_id) ?? r.author_id,
          isMe: r.author_id === user.id,
        }))}
      />
    </div>
  );
}
