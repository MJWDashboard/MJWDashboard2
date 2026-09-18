"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export async function completeOnboarding() {
  const user = await getCurrentUser();
  if (!user) return;

  const supabase = createClient();
  await supabase
    .from("organization_users")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("user_id", user.id);
}
