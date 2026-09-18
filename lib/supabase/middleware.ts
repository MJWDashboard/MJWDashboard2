import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isSecurityRoute = pathname.startsWith("/dashboard/security");

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Elevated accounts (org admins and the platform admin) must have 2FA set
  // up and completed for the current session before reaching anything else
  // in the dashboard - they always keep access to the security page itself
  // so they can finish enrollment rather than getting locked out.
  if (user && isProtectedRoute && !isSecurityRoute) {
    const [{ data: isOrgAdmin }, { data: isPlatformAdmin }] = await Promise.all([
      supabase
        .from("organization_users")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle(),
      supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    ]);

    if (isOrgAdmin || isPlatformAdmin) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.currentLevel !== "aal2") {
        const redirectUrl = new URL("/dashboard/security", request.url);
        redirectUrl.searchParams.set("mfa_required", "1");
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}
