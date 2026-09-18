import { SupabaseClient } from "@supabase/supabase-js";
import type { CurrentUser } from "./org";

// Portfolios where this user can manage the team (invite, change roles,
// assign buildings, and now also assign tasks/messages to members) - the
// org admin plus whoever holds the portfolio_manager role.
export async function getManagedPortfolioIds(
  supabase: SupabaseClient,
  user: CurrentUser
): Promise<string[]> {
  if (user.role === "admin") {
    const { data } = await supabase
      .from("portfolios")
      .select("id")
      .eq("organization_id", user.organizationId);
    return (data ?? []).map((p) => p.id);
  }

  const { data } = await supabase
    .from("portfolio_users")
    .select("portfolio_id")
    .eq("user_id", user.id)
    .eq("role", "portfolio_manager");
  return (data ?? []).map((r) => r.portfolio_id);
}

export async function getUnreadTeamMessageCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: messages } = await supabase
    .from("team_messages")
    .select("id, updated_at")
    .or(`assigned_to.eq.${userId},created_by.eq.${userId}`);

  if (!messages || messages.length === 0) return 0;

  const { data: reads } = await supabase
    .from("team_message_reads")
    .select("message_id, last_read_at")
    .eq("user_id", userId)
    .in(
      "message_id",
      messages.map((m) => m.id)
    );

  const readAt = new Map((reads ?? []).map((r) => [r.message_id, r.last_read_at]));

  return messages.filter((m) => {
    const lastRead = readAt.get(m.id);
    return !lastRead || new Date(lastRead) < new Date(m.updated_at);
  }).length;
}
