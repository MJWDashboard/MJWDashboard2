"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type MeetingInput = {
  title: string;
  building_id: string;
  meeting_date: string;
  location: string;
  meeting_type: string;
  attendees: string;
  agenda: string;
  pre_meeting_notes: string;
  status: string;
};

function buildPayload(input: MeetingInput) {
  return {
    title: input.title,
    building_id: input.building_id || null,
    meeting_date: input.meeting_date,
    location: input.location || null,
    meeting_type: input.meeting_type || null,
    attendees: input.attendees
      ? input.attendees.split(",").map((a) => a.trim()).filter(Boolean)
      : null,
    agenda: input.agenda || null,
    pre_meeting_notes: input.pre_meeting_notes || null,
    status: input.status as any,
  };
}

export async function createMeeting(input: MeetingInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", id: null };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      ...buildPayload(input),
      organization_id: user.organizationId,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message, id: null };
  revalidatePath("/dashboard/meetings");
  return { error: null, id: data.id as string };
}

export async function updateMeeting(id: string, input: MeetingInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("meetings")
    .update({
      ...buildPayload(input),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/meetings");
  revalidatePath(`/dashboard/meetings/${id}`);
  return { error: null };
}

export async function setMeetingLifecycle(id: string, status: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ status: status as any, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/meetings");
  revalidatePath(`/dashboard/meetings/${id}`);
  return { error: null };
}

export async function saveTranscript(id: string, rawTranscript: string, summary: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("meetings")
    .update({
      raw_transcript: rawTranscript || null,
      summary: summary || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/meetings/${id}`);
  return { error: null };
}

export async function addMeetingNote(
  meetingId: string,
  tenantId: string | null,
  note: string,
  category: "note" | "decision" = "note"
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("meeting_notes").insert({
    meeting_id: meetingId,
    tenant_id: tenantId,
    note,
    category,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/meetings/${meetingId}`);
  return { error: null };
}

export async function convertNoteToAction(
  noteId: string,
  meetingId: string,
  buildingId: string | null,
  tenantId: string | null,
  title: string
) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { data: action, error: actionError } = await supabase
    .from("action_items")
    .insert({
      title,
      building_id: buildingId,
      tenant_id: tenantId,
      meeting_id: meetingId,
      priority: "medium",
      status: "not_started",
      organization_id: user.organizationId,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (actionError) return { error: actionError.message };

  const { error: noteError } = await supabase
    .from("meeting_notes")
    .update({ converted_to_action_id: action.id })
    .eq("id", noteId);

  if (noteError) return { error: noteError.message };

  revalidatePath(`/dashboard/meetings/${meetingId}`);
  revalidatePath("/dashboard/actions");
  return { error: null };
}

export type MeetingActionInput = {
  meeting_id: string;
  building_id: string | null;
  tenant_id: string | null;
  title: string;
  priority: string;
  due_date: string;
};

export async function addMeetingAction(input: MeetingActionInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("action_items").insert({
    title: input.title,
    building_id: input.building_id,
    tenant_id: input.tenant_id,
    meeting_id: input.meeting_id,
    priority: input.priority as any,
    due_date: input.due_date || null,
    status: "not_started",
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/meetings/${input.meeting_id}`);
  revalidatePath("/dashboard/actions");
  return { error: null };
}

export type MeetingRiskInput = {
  meeting_id: string;
  building_id: string | null;
  tenant_id: string | null;
  description: string;
  severity: string;
  mitigation: string;
  deadline: string;
  escalation_flag: boolean;
};

export async function addMeetingRisk(input: MeetingRiskInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("risks").insert({
    meeting_id: input.meeting_id,
    building_id: input.building_id,
    tenant_id: input.tenant_id,
    description: input.description,
    severity: input.severity as any,
    mitigation: input.mitigation || null,
    deadline: input.deadline || null,
    escalation_flag: input.escalation_flag,
    owner: user.id,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/meetings/${input.meeting_id}`);
  return { error: null };
}
