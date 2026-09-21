import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForTokens, saveGoogleAccount } from "@/lib/google";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get("google_oauth_state")?.value;
  const error = searchParams.get("error");

  const redirectWithStatus = (status: "connected" | "error", message?: string) => {
    const url = new URL("/calendar", origin);
    url.searchParams.set("google", status);
    if (message) url.searchParams.set("message", message);
    return NextResponse.redirect(url);
  };

  if (error) return redirectWithStatus("error", error);
  if (!code || !state || state !== expectedState) return redirectWithStatus("error", "invalid_state");

  try {
    const tokens = await exchangeCodeForTokens(code, origin);
    await saveGoogleAccount(tokens);
  } catch (err) {
    return redirectWithStatus("error", err instanceof Error ? err.message : "unknown_error");
  }

  const response = redirectWithStatus("connected");
  response.cookies.delete("google_oauth_state");
  return response;
}
