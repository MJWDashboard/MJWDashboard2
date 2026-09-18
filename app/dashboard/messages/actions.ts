"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { sendEmail, absoluteUrl } from "@/lib/email";
import type { Database } from "@/lib/supabase/database.types";

type MessageStatus = Database["public"]["Enums"]["record_status"];

export type CreateMessageInput = {
  type: "task" | "message";
  subject: string;
  body: string;
  portfolioId: string;
  buildingId: string | null;
  assignedTo: string;
  dueDate: string | null;
};

export async function createTeamMessage(input: CreateMessageInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };
  if (!input.subject.trim()) return { error: "Subject is required." };
  if (!input.portfolioId) return { error: "Choose a portfolio." };
  if (!input.assignedTo) return { error: "Choose who this is for." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("team_messages")
    .insert({
      organization_id: user.organizationId,
      portfolio_id: input.portfolioId,
      building_id: input.buildingId,
      type: input.type,
      subject: input.subject.trim(),
      body: input.body.trim() || null,
      due_date: input.type === "task" ? input.dueDate : null,
      assigned_to: input.assignedTo,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "42501" || error.message.toLowerCase().includes("row-level security"))
      return { error: "You don't have permission to send tasks or messages for that portfolio." };
    return { error: error.message };
  }

  revalidatePath("/dashboard/messages");

  const { data: emails } = await supabase.rpc("org_member_emails");
  const assigneeEmail = emails?.find((e) => e.user_id === input.assignedTo)?.email;
  if (assigneeEmail) {
    await sendEmail({
      to: assigneeEmail,
      subject: `${input.type === "task" ? "New task" : "New message"}: ${input.subject}`,
      html: `<p><strong>${user.email}</strong> assigned you a ${input.type}.</p>
<p><strong>${input.subject.trim()}</strong></p>
${input.body.trim() ? `<p>${input.body.trim()}</p>` : ""}
<p><a href="${absoluteUrl(`/dashboard/messages/${data.id}`)}">View in Vorexa</a></p>`,
    });
  }

  return { error: null, id: data.id };
}

export async function replyToMessage(messageId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };
  if (!body.trim()) return { error: "Reply can't be empty." };

  const supabase = createClient();
  const { error } = await supabase.from("team_message_replies").insert({
    message_id: messageId,
    author_id: user.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };

  await supabase
    .from("team_message_reads")
    .upsert(
      { message_id: messageId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "message_id,user_id" }
    );

  revalidatePath(`/dashboard/messages/${messageId}`);
  revalidatePath("/dashboard/messages");

  const { data: message } = await supabase
    .from("team_messages")
    .select("subject, created_by, assigned_to")
    .eq("id", messageId)
    .maybeSingle();

  if (message) {
    const recipientId = user.id === message.created_by ? message.assigned_to : message.created_by;
    const { data: emails } = await supabase.rpc("org_member_emails");
    const recipientEmail = emails?.find((e) => e.user_id === recipientId)?.email;
    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: `Re: ${message.subject}`,
        html: `<p><strong>${user.email}</strong> replied.</p>
<p>${body.trim()}</p>
<p><a href="${absoluteUrl(`/dashboard/messages/${messageId}`)}">View in Vorexa</a></p>`,
      });
    }
  }

  return { error: null };
}

export async function updateMessageStatus(messageId: string, status: MessageStatus) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase.from("team_messages").update({ status }).eq("id", messageId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/messages/${messageId}`);
  revalidatePath("/dashboard/messages");
  return { error: null };
}

export async function markMessageRead(messageId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = createClient();
  await supabase
    .from("team_message_reads")
    .upsert(
      { message_id: messageId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "message_id,user_id" }
    );
}

export async function deleteTeamMessage(messageId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase.from("team_messages").delete().eq("id", messageId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/messages");
  redirect("/dashboard/messages");
}
