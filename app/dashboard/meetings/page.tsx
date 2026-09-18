import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { MeetingFormButton } from "./MeetingForm";

export default async function MeetingsPage() {
  const supabase = createClient();

  const [{ data: meetings }, { data: buildings }] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, meeting_date, status, buildings(name)")
      .is("archived_at", null)
      .order("meeting_date", { ascending: false }),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Meetings"
        description={`${meetings?.length ?? 0} meetings`}
        action={<MeetingFormButton label="+ New Meeting" buildings={buildings ?? []} />}
      />

      {meetings && meetings.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Title</th>
                <th>Building</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m: any) => (
                <tr key={m.id}>
                  <td>
                    <Link href={`/dashboard/meetings/${m.id}`} className="font-medium text-cyan-400 hover:underline">
                      {m.title}
                    </Link>
                  </td>
                  <td>{m.buildings?.name ?? "—"}</td>
                  <td>{formatDateTime(m.meeting_date)}</td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No meetings yet" description="Start a new meeting to enter Meeting Mode." />
      )}
    </div>
  );
}
