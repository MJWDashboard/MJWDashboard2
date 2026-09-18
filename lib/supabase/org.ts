import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  organizationId: string;
  organizationName: string;
  role: string;
  onboardingCompletedAt: string | null;
};

/**
 * Resolves the signed-in user's organization membership. Middleware already
 * guarantees a session exists on every non-/login route, so a null return
 * here means the user has no organization_users row yet (not yet invited).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_users")
    .select("organization_id, role, onboarding_completed_at, organizations ( name )")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    organizationId: membership.organization_id,
    organizationName:
      (membership.organizations as { name: string } | null)?.name ?? "Portfolio",
    role: membership.role,
    onboardingCompletedAt: membership.onboarding_completed_at,
  };
}
