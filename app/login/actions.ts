"use server";

import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

// Public self-registration is intentionally not exposed. Vorexa Core has no
// public sign-up — accounts are created by the platform administrator via
// the invite-only flow in /developer (app/(app)/developer/actions.ts,
// which uses the Supabase service-role admin API), and the database trigger
// (see supabase/migrations/0002 and 0010) rejects any direct signUp call
// regardless of how it's invoked.

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
