import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";

/**
 * Runs at 04:30 SAST (02:30 UTC, no DST in South Africa — see vercel.json).
 * Computes each account's own pending count and top-3 watchlist —
 * per-owner, never pooled, now that more than one person can sign in.
 * Delivery is push/email — a separate decision (which channel, which
 * provider) — so for now this logs per account; ask before wiring one in.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: owners, error: ownersError } = await supabase.from("profiles").select("id");

  if (ownersError) {
    return NextResponse.json({ error: ownersError.message }, { status: 500 });
  }

  const digests = await Promise.all(
    (owners ?? []).map(async ({ id: ownerId }) => {
      const [{ data: watchlist }, { count: pendingCount }] = await Promise.all([
        supabase
          .from("reminders")
          .select("*")
          .eq("owner_id", ownerId)
          .neq("status", "done")
          .order("severity", { ascending: false })
          .order("due_at", { ascending: true })
          .limit(3),
        supabase
          .from("reminders")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", ownerId)
          .eq("status", "pending"),
      ]);

      return { ownerId, pendingCount: pendingCount ?? 0, top: (watchlist ?? []).map((r) => r.title) };
    })
  );

  console.log("[digest]", digests);

  return NextResponse.json({ digests });
}
