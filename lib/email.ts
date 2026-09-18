const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mjw-dashboard2.vercel.app";

export function absoluteUrl(path: string): string {
  return `${APP_URL}${path}`;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set - skipping "${subject}" to ${to}`);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "Vorexa <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error(`[email] Resend error ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("[email] send failed", err);
  }
}
