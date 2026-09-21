import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/manifest.json"];
const MFA_SETUP_PATH = "/mfa-setup";
const MFA_CHALLENGE_PATH = "/mfa-challenge";

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p)) ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico" ||
    pathname === "/sw.js"
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user) {
    if (isPublic(pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Mandatory MFA: every signed-in session must reach aal2 before it can
  // reach app data. aal1->aal1 (no factor yet) forces enrollment; aal1->aal2
  // (factor exists, not verified this session) forces the challenge.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal) {
    if (aal.currentLevel === "aal1" && aal.nextLevel === "aal1" && pathname !== MFA_SETUP_PATH) {
      const url = request.nextUrl.clone();
      url.pathname = MFA_SETUP_PATH;
      return NextResponse.redirect(url);
    }
    if (aal.currentLevel === "aal1" && aal.nextLevel === "aal2" && pathname !== MFA_CHALLENGE_PATH) {
      const url = request.nextUrl.clone();
      url.pathname = MFA_CHALLENGE_PATH;
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login" || pathname === MFA_SETUP_PATH || pathname === MFA_CHALLENGE_PATH) {
    if (aal?.currentLevel === "aal2" || !aal) {
      const url = request.nextUrl.clone();
      url.pathname = "/today";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
