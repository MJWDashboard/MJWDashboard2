import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { NewPortfolioButton } from "./PortfolioForm";
import { InviteForm } from "./InviteForm";
import { RevokeInvitationButton, MemberRow } from "./MemberActions";
import { PORTFOLIO_ROLE_LABEL, type PortfolioRole } from "./roles";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");

  const isOrgAdmin = user.role === "admin";
  const supabase = createClient();

  const { data: viewerRoles } = await supabase
    .from("portfolio_users")
    .select("portfolio_id, role")
    .eq("user_id", user.id);

  const roleByPortfolio = new Map<string, PortfolioRole>(
    (viewerRoles ?? []).map((r: any) => [r.portfolio_id, r.role])
  );

  const managedPortfolioIds = Array.from(roleByPortfolio.entries())
    .filter(([, role]) => role === "portfolio_manager" || role === "administrator")
    .map(([id]) => id);

  if (!isOrgAdmin && managedPortfolioIds.length === 0) {
    redirect("/dashboard");
  }

  const portfoliosQuery = isOrgAdmin
    ? supabase.from("portfolios").select("id, name").order("name")
    : supabase.from("portfolios").select("id, name").in("id", managedPortfolioIds).order("name");

  const [{ data: portfolios }, { data: buildings }, { data: memberships }, { data: assignments }, { data: invitations }, { data: emailRows }] =
    await Promise.all([
      portfoliosQuery,
      supabase.from("buildings").select("id, name, portfolio_id").order("name"),
      supabase.from("portfolio_users").select("id, role, user_id, portfolio_id"),
      supabase.from("building_assignments").select("id, user_id, building_id, portfolio_id"),
      supabase
        .from("organization_invitations")
        .select("id, email, portfolio_role, created_at, portfolio_id")
        .is("accepted_at", null)
        .not("portfolio_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase.rpc("org_member_emails"),
    ]);

  const emailByUserId = new Map((emailRows ?? []).map((r: any) => [r.user_id, r.email]));
  const buildingById = new Map((buildings ?? []).map((b: any) => [b.id, b]));

  const portfolioList = portfolios ?? [];

  if (portfolioList.length === 0) {
    return (
      <div>
        <PageHeader
          title="Team & Access"
          description="Invite people to a portfolio and control what they can see"
          action={isOrgAdmin ? <NewPortfolioButton /> : undefined}
        />
        <EmptyState title="No portfolios yet" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Team & Access"
        description="Invite people to a portfolio, assign them buildings, and control what they can see"
        action={isOrgAdmin ? <NewPortfolioButton /> : undefined}
      />

      <div className="space-y-8">
        {portfolioList.map((portfolio: any) => {
          const viewerRole = roleByPortfolio.get(portfolio.id);
          const canManageTeam = isOrgAdmin || viewerRole === "portfolio_manager";
          const canManageBuildings = isOrgAdmin || viewerRole === "portfolio_manager" || viewerRole === "administrator";

          const portfolioBuildings = (buildings ?? []).filter((b: any) => b.portfolio_id === portfolio.id);
          const portfolioMembers = (memberships ?? []).filter((m: any) => m.portfolio_id === portfolio.id);
          const portfolioAssignments = (assignments ?? []).filter((a: any) => a.portfolio_id === portfolio.id);
          const portfolioInvitations = (invitations ?? []).filter((i: any) => i.portfolio_id === portfolio.id);

          // Administrators may only delegate within the buildings they themselves
          // are assigned to; portfolio managers and org admins may assign any
          // building in the portfolio. This is a UX hint - RLS is the real gate.
          const availableBuildings =
            viewerRole === "administrator" && !isOrgAdmin
              ? portfolioBuildings.filter((b: any) =>
                  portfolioAssignments.some((a: any) => a.building_id === b.id && a.user_id === user.id)
                )
              : portfolioBuildings;

          return (
            <section key={portfolio.id}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-charcoal-100">{portfolio.name}</h2>
                {viewerRole && (
                  <Badge
                    label={PORTFOLIO_ROLE_LABEL[viewerRole]}
                    className="bg-charcoal-600/60 text-charcoal-200"
                  />
                )}
              </div>

              {canManageTeam && (
                <div className="mb-4">
                  <InviteForm portfolioId={portfolio.id} portfolioName={portfolio.name} />
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                    Portfolio Access
                  </h3>
                  {portfolioMembers.length > 0 ? (
                    <div className="table-shell">
                      <table className="table-base">
                        <thead>
                          <tr>
                            <th>Person</th>
                            <th>Role</th>
                            <th>Buildings</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {portfolioMembers.map((m: any) => {
                            const memberAssignments = portfolioAssignments
                              .filter((a: any) => a.user_id === m.user_id)
                              .map((a: any) => ({
                                assignmentId: a.id,
                                buildingId: a.building_id,
                                buildingName: buildingById.get(a.building_id)?.name ?? "Unknown building",
                              }));

                            return (
                              <MemberRow
                                key={m.id}
                                portfolioId={portfolio.id}
                                portfolioUserId={m.id}
                                userId={m.user_id}
                                email={emailByUserId.get(m.user_id) ?? m.user_id}
                                role={m.role}
                                canManageTeam={canManageTeam}
                                canManageBuildings={canManageBuildings}
                                assignedBuildings={memberAssignments}
                                availableBuildings={availableBuildings}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState title="No one has been added to this portfolio yet" />
                  )}
                </div>

                {canManageTeam && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                      Pending Invitations
                    </h3>
                    {portfolioInvitations.length > 0 ? (
                      <div className="table-shell">
                        <table className="table-base">
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Invited</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {portfolioInvitations.map((i: any) => (
                              <tr key={i.id}>
                                <td>{i.email}</td>
                                <td>
                                  <Badge
                                    label={PORTFOLIO_ROLE_LABEL[i.portfolio_role as PortfolioRole] ?? i.portfolio_role}
                                    className="bg-charcoal-600/60 text-charcoal-200"
                                  />
                                </td>
                                <td>{formatDate(i.created_at)}</td>
                                <td className="text-right">
                                  <RevokeInvitationButton invitationId={i.id} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState title="No pending invitations" />
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
