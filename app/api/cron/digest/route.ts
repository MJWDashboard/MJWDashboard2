import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";

/**
 * Runs at 04:30 SAST (02:30 UTC, no DST in South Africa — see vercel.json).
 * Phase 0 scope: compute the counts and top-3 watchlist a digest needs.
 * Actual email/push delivery is wired in Phase 1 once a provider is chosen;
 * until then this just logs, so the schedule and query shape are proven.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: watchlist, error } = await supabase
    .from("reminders")
    .select("*")
    .neq("status", "done")
    .order("severity", { ascending: false })
    .order("due_at", { ascending: true })
    .limit(3);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count: pendingCount } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  console.log("[digest]", { pendingCount, top: watchlist?.map((r) => r.title) });

  return NextResponse.json({ pendingCount, top: watchlist ?? [] });
}
