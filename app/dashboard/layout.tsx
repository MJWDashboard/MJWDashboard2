import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { getUnreadTeamMessageCount } from "@/lib/supabase/teamAccess";
import { isPlatformAdmin } from "@/lib/supabase/platformAdmin";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { Sidebar } from "@/components/Sidebar";
import { PortfolioSelector } from "@/components/PortfolioSelector";
import { SignOutButton } from "@/components/SignOutButton";
import { GlobalSearch } from "@/components/GlobalSearch";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
        <div className="card max-w-md text-center">
          <h1 className="mb-2 text-lg font-semibold text-charcoal-100">
            Waiting for access
          </h1>
          <p className="text-sm text-charcoal-300">
            Your account was created, but you haven&apos;t been granted access
            yet. Ask your Vorexa administrator to invite your email address,
            then sign in again.
          </p>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  const supabase = createClient();
  const [{ data: portfolios }, { data: portfolioRoles }, messagesUnreadCount, isDeveloperAdmin] = await Promise.all([
    supabase.from("portfolios").select("id, name").order("name"),
    supabase.from("portfolio_users").select("role").eq("user_id", user.id),
    getUnreadTeamMessageCount(supabase, user.id),
    isPlatformAdmin(supabase, user.id),
  ]);

  const selectedPortfolio = getSelectedPortfolio();
  const canAccessTeam =
    user.role === "admin" ||
    (portfolioRoles ?? []).some((r) => r.role === "portfolio_manager" || r.role === "administrator");
  const canViewAuditLog = user.role === "admin" || isDeveloperAdmin;

  return (
    <div className="flex min-h-screen bg-charcoal-950">
      <Sidebar
        canAccessTeam={canAccessTeam}
        messagesUnreadCount={messagesUnreadCount}
        canViewAuditLog={canViewAuditLog}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-none items-center justify-between gap-4 border-b border-charcoal-700 bg-charcoal-900/60 px-6">
          <PortfolioSelector portfolios={portfolios ?? []} selected={selectedPortfolio} />
          <GlobalSearch />
          <div className="flex flex-none items-center gap-4">
            <div className="text-right text-sm">
              <div className="text-charcoal-100">{user.organizationName}</div>
              <div className="text-xs text-charcoal-400">{user.email}</div>
            </div>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
