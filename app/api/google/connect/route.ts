import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { buildGoogleAuthUrl } from "@/lib/google";

export async function GET(request: NextRequest) {
  const state = randomUUID();
  const url = buildGoogleAuthUrl(request.nextUrl.origin, state);

  const response = NextResponse.redirect(url);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
