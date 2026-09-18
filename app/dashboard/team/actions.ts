"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import type { PortfolioRole } from "./roles";

async function requireSignedIn() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

async function requireOrgAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function createPortfolio(name: string) {
  const user = await requireOrgAdmin();
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
  portfolioRole: PortfolioRole;
};

export async function inviteToPortfolio(input: InviteInput) {
  const user = await requireSignedIn();
  if (!user) return { error: "You must be signed in.", grantedImmediately: false };

  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Email is required.", grantedImmediately: false };
  if (!input.portfolioId) return { error: "Choose a portfolio.", grantedImmediately: false };

  const supabase = createClient();

  // If this email already belongs to the org (an existing teammate being
  // added to another portfolio), grant access to that portfolio directly -
  // an invitation would just sit unconsumed, since it's only ever accepted
  // by the brand-new-signup trigger.
  const { data: existing } = await supabase.rpc("find_org_member_by_email", {
    target_email: email,
  });
  const match = existing?.[0];

  if (match?.already_org_member) {
    const { error } = await supabase
      .from("portfolio_users")
      .upsert(
        {
          portfolio_id: input.portfolioId,
          user_id: match.user_id,
          role: input.portfolioRole,
          created_by: user.id,
        },
        { onConflict: "portfolio_id,user_id" }
      );

    if (error) return { error: error.message, grantedImmediately: false };
    revalidatePath("/dashboard/team");
    return { error: null, grantedImmediately: true };
  }

  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: user.organizationId,
    email,
    role: "property_manager",
    portfolio_id: input.portfolioId,
    portfolio_role: input.portfolioRole,
    invited_by: user.id,
  });

  if (error) return { error: error.message, grantedImmediately: false };
  revalidatePath("/dashboard/team");
  return { error: null, grantedImmediately: false };
}

export async function revokeInvitation(invitationId: string) {
  const user = await requireSignedIn();
  if (!user) return { error: "You must be signed in." };

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
  const user = await requireSignedIn();
  if (!user) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase.from("portfolio_users").delete().eq("id", portfolioUserId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { error: null };
}

export async function updatePortfolioMemberRole(portfolioUserId: string, role: PortfolioRole) {
  const user = await requireSignedIn();
  if (!user) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("portfolio_users")
    .update({ role })
    .eq("id", portfolioUserId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { error: null };
}

export async function assignBuildingToMember(input: {
  portfolioId: string;
  buildingId: string;
  userId: string;
}) {
  const user = await requireSignedIn();
  if (!user) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase.from("building_assignments").insert({
    portfolio_id: input.portfolioId,
    building_id: input.buildingId,
    user_id: input.userId,
    assigned_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "That person is already assigned to this building." };
    if (error.code === "42501" || error.message.toLowerCase().includes("row-level security"))
      return { error: "You don't have permission to assign that building." };
    return { error: error.message };
  }
  revalidatePath("/dashboard/team");
  return { error: null };
}

export async function unassignBuildingFromMember(assignmentId: string) {
  const user = await requireSignedIn();
  if (!user) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase.from("building_assignments").delete().eq("id", assignmentId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team");
  return { error: null };
}
