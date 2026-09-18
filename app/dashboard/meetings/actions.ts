"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type MeetingInput = {
  title: string;
  building_id: string;
  meeting_date: string;
  attendees: string;
  agenda: string;
  status: string;
};

export async function createMeeting(input: MeetingInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", id: null };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      title: input.title,
      building_id: input.building_id || null,
      meeting_date: input.meeting_date,
      attendees: input.attendees
        ? input.attendees.split(",").map((a) => a.trim()).filter(Boolean)
        : null,
      agenda: input.agenda || null,
      status: input.status as any,
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
      title: input.title,
      building_id: input.building_id || null,
      meeting_date: input.meeting_date,
      attendees: input.attendees
        ? input.attendees.split(",").map((a) => a.trim()).filter(Boolean)
        : null,
      agenda: input.agenda || null,
      status: input.status as any,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/meetings");
  revalidatePath(`/dashboard/meetings/${id}`);
  return { error: null };
}

export async function addMeetingNote(meetingId: string, tenantId: string | null, note: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("meeting_notes").insert({
    meeting_id: meetingId,
    tenant_id: tenantId,
    note,
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
