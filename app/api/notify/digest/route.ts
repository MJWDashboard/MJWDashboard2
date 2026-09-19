import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";

// A small authenticated relay so external jobs (the daily reconciliation
// routine) can send through the dashboard's own Resend setup instead of
// needing their own email credentials. Never exposed to the browser.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subject = typeof body?.subject === "string" ? body.subject : null;
  const html = typeof body?.html === "string" ? body.html : null;
  if (!subject || !html) {
    return NextResponse.json({ error: "subject and html are required." }, { status: 400 });
  }

  let to = typeof body?.to === "string" ? body.to : null;
  if (!to) {
    const systemUserId = process.env.SHEET_SYNC_SYSTEM_USER_ID;
    if (systemUserId) {
      const supabase = createServiceRoleClient();
      const { data } = await supabase.auth.admin.getUserById(systemUserId);
      to = data?.user?.email ?? null;
    }
  }
  if (!to) {
    return NextResponse.json({ error: "No recipient - pass 'to' or configure SHEET_SYNC_SYSTEM_USER_ID." }, { status: 400 });
  }

  await sendEmail({ to, subject, html });
  return NextResponse.json({ sent: true, to });
}
