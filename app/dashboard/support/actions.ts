"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type TicketCategory = "fault" | "bug" | "question" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export type CreateTicketInput = {
  category: TicketCategory;
  subject: string;
  description: string;
  buildingId: string | null;
  priority: TicketPriority;
};

export async function createSupportTicket(input: CreateTicketInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };
  if (!input.subject.trim()) return { error: "Subject is required." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      organization_id: user.organizationId,
      building_id: input.buildingId,
      category: input.category,
      subject: input.subject.trim(),
      description: input.description.trim() || null,
      priority: input.priority,
      reported_by: user.id,
    })
    .select("id, ticket_number")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/support");
  return { error: null, id: data.id, ticketNumber: data.ticket_number };
}

export async function replyToTicket(ticketId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };
  if (!body.trim()) return { error: "Reply can't be empty." };

  const supabase = createClient();
  const { error } = await supabase.from("support_ticket_comments").insert({
    ticket_id: ticketId,
    author_id: user.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");
  return { error: null };
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase.from("support_tickets").update({ status }).eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/support/${ticketId}`);
  revalidatePath("/dashboard/support");
  return { error: null };
}
