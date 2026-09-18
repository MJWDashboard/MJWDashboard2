import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PdfExportButton } from "@/components/PdfExportButton";
import { formatDateTime } from "@/lib/format";
import { MeetingFormButton } from "../MeetingForm";
import { MeetingModeClient } from "./MeetingModeClient";
import { TranscriptPanel } from "./TranscriptPanel";
import { LifecycleSelect } from "./LifecycleSelect";

export default async function MeetingModePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*, buildings(id, name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!meeting) notFound();

  const [{ data: notes }, { data: risks }, { data: actions }, { data: tenants }, { data: buildings }] =
    await Promise.all([
      supabase
        .from("meeting_notes")
        .select("id, note, category, tenant_id, converted_to_action_id, created_at, tenants(trading_name)")
        .eq("meeting_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("risks")
        .select("id, description, severity, mitigation, deadline, escalation_flag, status")
        .eq("meeting_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("action_items")
        .select("id, title, priority, due_date, status")
        .eq("meeting_id", params.id)
        .order("created_at", { ascending: false }),
      meeting.building_id
        ? supabase
            .from("tenants")
            .select("id, trading_name")
            .eq("building_id", meeting.building_id)
            .is("archived_at", null)
            .order("trading_name")
        : Promise.resolve({ data: [] }),
      supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    ]);

  return (
    <div>
      <PageHeader
        title={meeting.title}
        description={
          <>
            {meeting.buildings?.name ?? "No building"} · {formatDateTime(meeting.meeting_date)}
            {meeting.meeting_type ? ` · ${meeting.meeting_type}` : ""}
            {meeting.location ? ` · ${meeting.location}` : ""}
          </>
        }
        action={
          <div className="flex items-center gap-3">
            <LifecycleSelect meetingId={meeting.id} status={meeting.status} />
            <PdfExportButton
              filename={`meeting-pack-${meeting.id.slice(0, 8)}`}
              title={meeting.title}
              subtitle={`${meeting.buildings?.name ?? "No building"} · ${formatDateTime(meeting.meeting_date)}`}
              columns={["Time", "Note", "Tenant"]}
              rows={(notes ?? []).map((n: any) => [
                formatDateTime(n.created_at),
                n.note,
                n.tenants?.trading_name ?? "—",
              ])}
            />
            <MeetingFormButton meeting={meeting} label="Edit" buildings={buildings ?? []} />
          </div>
        }
      />

      {(meeting.agenda || meeting.pre_meeting_notes) && (
        <div className="card mb-6">
          {meeting.agenda && (
            <>
              <h2 className="mb-2 text-sm font-semibold">Agenda</h2>
              <p className="mb-4 whitespace-pre-wrap text-sm text-charcoal-300">{meeting.agenda}</p>
            </>
          )}
          {meeting.pre_meeting_notes && (
            <>
              <h2 className="mb-2 text-sm font-semibold">Pre-Meeting Notes</h2>
              <p className="whitespace-pre-wrap text-sm text-charcoal-300">{meeting.pre_meeting_notes}</p>
            </>
          )}
        </div>
      )}

      {meeting.attendees && meeting.attendees.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {meeting.attendees.map((a: string, i: number) => (
            <span key={i} className="rounded-full bg-charcoal-700 px-3 py-1 text-xs text-charcoal-200">
              {a}
            </span>
          ))}
        </div>
      )}

      <MeetingModeClient
        meetingId={meeting.id}
        buildingId={meeting.building_id}
        tenants={tenants ?? []}
        initialNotes={(notes ?? []) as any}
        initialRisks={(risks ?? []) as any}
        initialActions={(actions ?? []) as any}
      />

      <div className="mt-6">
        <TranscriptPanel
          meetingId={meeting.id}
          initialTranscript={meeting.raw_transcript}
          initialSummary={meeting.summary}
        />
      </div>
    </div>
  );
}
