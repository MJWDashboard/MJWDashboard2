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

export async function register(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName || null, last_name: lastName || null } },
  });

  if (error) {
    // Postgres exceptions raised from the handle_new_user trigger (the
    // invite-only guard) surface as a generic "Database error saving new
    // user" — give the person the real reason instead.
    if (/database error/i.test(error.message)) {
      return { error: "This platform is invite-only. Ask the developer for access.", signedIn: false };
    }
    return { error: error.message, signedIn: false };
  }

  return { error: null, signedIn: Boolean(data.session) };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
