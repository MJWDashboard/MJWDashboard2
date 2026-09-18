"use client";

import { createClient } from "@/lib/supabase/client";

export async function reportClientError(error: unknown, context?: Record<string, unknown>) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? (error.stack ?? null) : null;
    const supabase = createClient();
    await supabase.from("app_errors").insert({
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 8000) ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
      context: (context ?? null) as never,
    });
  } catch {
    // Reporting must never itself throw or mask the original error.
  }
}
