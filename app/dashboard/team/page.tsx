import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { NewPortfolioButton } from "./PortfolioForm";
import { InviteForm } from "./InviteForm";
import { RoleSelect, RemoveMemberButton, RevokeInvitationButton } from "./MemberActions";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = createClient();

  const [{ data: portfolios }, { data: memberships }, { data: invitations }, { data: emailRows }] =
    await Promise.all([
      supabase.from("portfolios").select("id, name").order("name"),
      supabase
        .from("portfolio_users")
        .select("id, role, user_id, portfolio_id, portfolios(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("organization_invitations")
        .select("id, email, portfolio_role, created_at, expires_at, portfolios(name)")
        .is("accepted_at", null)
        .not("portfolio_id", "is", null)
        .order("created_at", { ascending: false }),
      supabase.rpc("org_member_emails"),
    ]);

  const emailByUserId = new Map((emailRows ?? []).map((r: any) => [r.user_id, r.email]));

  return (
    <div>
      <PageHeader
        title="Team & Access"
        description="Invite people to a portfolio and control what they can see"
        action={<NewPortfolioButton />}
      />

      <div className="mb-6">
        <InviteForm portfolios={portfolios ?? []} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-charcoal-100">Portfolio Access</h2>
          {memberships && memberships.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Portfolio</th>
                    <th>Role</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((m: any) => (
                    <tr key={m.id}>
                      <td>{emailByUserId.get(m.user_id) ?? m.user_id}</td>
                      <td>{m.portfolios?.name ?? "—"}</td>
                      <td>
                        <RoleSelect portfolioUserId={m.id} role={m.role} />
                      </td>
                      <td className="text-right">
                        <RemoveMemberButton portfolioUserId={m.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No one has been added to a portfolio yet" />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-charcoal-100">Pending Invitations</h2>
          {invitations && invitations.length > 0 ? (
            <div className="table-shell">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Portfolio</th>
                    <th>Role</th>
                    <th>Invited</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((i: any) => (
                    <tr key={i.id}>
                      <td>{i.email}</td>
                      <td>{i.portfolios?.name ?? "—"}</td>
                      <td>
                        <Badge
                          label={i.portfolio_role}
                          className="bg-charcoal-600/60 capitalize text-charcoal-200"
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
        </section>
      </div>
    </div>
  );
}
