import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip } from "@/components/FilterChip";
import { MeetingFormButton } from "./MeetingForm";
import { MeetingsTable } from "./MeetingsTable";
import { getSelectedBuilding } from "@/lib/building";

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: { building_id?: string };
}) {
  const supabase = createClient();
  const selectedBuilding = getSelectedBuilding();
  const buildingId = searchParams.building_id ?? (selectedBuilding !== "all" ? selectedBuilding : undefined);

  let query = supabase
    .from("meetings")
    .select("id, title, meeting_type, meeting_date, status, attendees, buildings(name)")
    .is("archived_at", null)
    .order("meeting_date", { ascending: false });

  if (buildingId) query = query.eq("building_id", buildingId);

  const [{ data: meetings }, { data: buildings }] = await Promise.all([
    query,
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Meetings"
        description={`${meetings?.length ?? 0} meetings - never deleted, always searchable`}
        action={<MeetingFormButton label="+ New Meeting" buildings={buildings ?? []} />}
      />

      {buildingId && (
        <FilterChip
          label={(buildings ?? []).find((b) => b.id === buildingId)?.name ?? "building"}
          clearHref="/dashboard/meetings"
        />
      )}

      {meetings && meetings.length > 0 ? (
        <MeetingsTable meetings={meetings} />
      ) : (
        <EmptyState title="No meetings yet" description="Start a new meeting to enter Meeting Mode." />
      )}
    </div>
  );
}
