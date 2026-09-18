"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function createPortfolio(name: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Only an administrator can create portfolios." };
  if (!name.trim()) return { error: "Portfolio name is required." };

  const supabase = createClient();
  const { error } = await supabase.from("portfolios").insert({
    name: name.trim(),
    organization_id: user.organizationId,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/buildings");
  return { error: null };
}

export type InviteInput = {
  email: string;
  portfolioId: string;
  portfolioRole: string;
};

export async function inviteToPortfolio(input: InviteInput) {
  const user = await requireAdmin();
  if (!user) return { error: "Only an administrator can invite people." };

  if (!input.email.trim()) return { error: "Email is required." };
  if (!input.portfolioId) return { error: "Choose a portfolio." };

  const supabase = createClient();
  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: user.organizationId,
    email: input.email.trim().toLowerCase(),
    role: "property_manager",
    portfolio_id: input.portfolioId,
    portfolio_role: input.portfolioRole,
    invited_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { error: null };
}

export async function revokeInvitation(invitationId: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Only an administrator can revoke invitations." };

  const supabase = createClient();
  const { error } = await supabase
    .from("organization_invitations")
    .delete()
    .eq("id", invitationId)
    .is("accepted_at", null);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { error: null };
}

export async function removePortfolioMember(portfolioUserId: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Only an administrator can remove access." };

  const supabase = createClient();
  const { error } = await supabase.from("portfolio_users").delete().eq("id", portfolioUserId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { error: null };
}

export async function updatePortfolioMemberRole(portfolioUserId: string, role: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Only an administrator can change roles." };

  const supabase = createClient();
  const { error } = await supabase
    .from("portfolio_users")
    .update({ role: role as any })
    .eq("id", portfolioUserId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { error: null };
}
