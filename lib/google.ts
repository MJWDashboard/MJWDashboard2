import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";

const SCOPE = "https://www.googleapis.com/auth/calendar openid email";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getGoogleRedirectUri(origin: string) {
  return `${origin}/api/google/callback`;
}

export function buildGoogleAuthUrl(origin: string, state: string) {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID"),
    redirect_uri: getGoogleRedirectUri(origin),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
};

export async function exchangeCodeForTokens(code: string, origin: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      code,
      grant_type: "authorization_code",
      redirect_uri: getGoogleRedirectUri(origin),
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  return res.json();
}

async function fetchGoogleUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.email ?? null;
}

/** Persists a fresh token pair after the initial OAuth exchange. */
export async function saveGoogleAccount(tokens: TokenResponse) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const email = await fetchGoogleUserEmail(tokens.access_token);
  const row: TablesInsert<"google_accounts"> = {
    owner_id: user.id,
    google_email: email,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? "",
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scope: tokens.scope,
  };

  // A re-connect may not return a new refresh_token (Google only issues one
  // on first consent) — keep the existing one rather than blanking it.
  const { data: existing } = await supabase.from("google_accounts").select("refresh_token").eq("owner_id", user.id).single();
  if (!row.refresh_token && existing?.refresh_token) row.refresh_token = existing.refresh_token;

  await supabase.from("google_accounts").upsert(row, { onConflict: "owner_id" });
}

/** Returns a valid access token, refreshing and persisting it first if expired. */
async function getValidAccessToken(): Promise<{ accessToken: string; accountId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase.from("google_accounts").select("*").eq("owner_id", user.id).single();
  if (!account) return null;

  if (new Date(account.token_expires_at) > new Date(Date.now() + 60_000)) {
    return { accessToken: account.access_token, accountId: account.id };
  }

  const refreshed = await refreshAccessToken(account.refresh_token);
  await supabase
    .from("google_accounts")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq("id", account.id);

  return { accessToken: refreshed.access_token, accountId: account.id };
}

type GoogleEvent = {
  id: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

/** Pulls events for the next 90 days from the primary calendar and upserts
 * them into our own `events` table, matched by google_event_id. One-way
 * (Google -> app) for now; the app doesn't push its own events back yet. */
export async function syncGoogleCalendar(): Promise<{ count: number } | { error: string }> {
  const auth = await getValidAccessToken();
  if (!auth) return { error: "Google Calendar isn't connected" };

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  if (!res.ok) return { error: `Google Calendar API error: ${await res.text()}` };

  const data = await res.json();
  const events: GoogleEvent[] = data.items ?? [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  for (const event of events) {
    const startsAt = event.start.dateTime ?? event.start.date;
    if (!startsAt || !event.summary) continue;
    await supabase.from("events").upsert(
      {
        owner_id: user.id,
        title: event.summary,
        location: event.location ?? null,
        starts_at: startsAt,
        ends_at: event.end?.dateTime ?? event.end?.date ?? null,
        all_day: !event.start.dateTime,
        source: "google",
        google_event_id: event.id,
      },
      { onConflict: "google_event_id" }
    );
  }

  await supabase.from("google_accounts").update({ last_synced_at: new Date().toISOString() }).eq("id", auth.accountId);

  return { count: events.length };
}

export async function disconnectGoogle() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("google_accounts").delete().eq("owner_id", user.id);
}
