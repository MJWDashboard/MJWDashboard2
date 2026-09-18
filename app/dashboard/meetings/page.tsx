import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MeetingFormButton } from "./MeetingForm";
import { MeetingsTable } from "./MeetingsTable";

export default async function MeetingsPage() {
  const supabase = createClient();

  const [{ data: meetings }, { data: buildings }] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, meeting_type, meeting_date, status, attendees, buildings(name)")
      .is("archived_at", null)
      .order("meeting_date", { ascending: false }),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Meetings"
        description={`${meetings?.length ?? 0} meetings - never deleted, always searchable`}
        action={<MeetingFormButton label="+ New Meeting" buildings={buildings ?? []} />}
      />

      {meetings && meetings.length > 0 ? (
        <MeetingsTable meetings={meetings} />
      ) : (
        <EmptyState title="No meetings yet" description="Start a new meeting to enter Meeting Mode." />
      )}
    </div>
  );
}
