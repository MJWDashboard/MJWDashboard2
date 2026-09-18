import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/StatusBadge";
import { RISK_SEVERITY_CLASSES, enumLabel } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/format";

async function getBuildingIdsForPortfolio(
  supabase: ReturnType<typeof createClient>,
  portfolioId: string
) {
  if (portfolioId === "all") return null;
  const { data } = await supabase
    .from("buildings")
    .select("id")
    .eq("portfolio_id", portfolioId);
  return (data ?? []).map((b) => b.id);
}

function ExceptionCard({
  title,
  count,
  href,
  children,
}: {
  title: string;
  count: number;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-charcoal-100">{title}</h2>
        <Badge
          label={String(count)}
          className={count > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}
        />
      </div>
      {count > 0 ? (
        <ul className="space-y-2">{children}</ul>
      ) : (
        <p className="text-sm text-charcoal-400">Nothing outstanding.</p>
      )}
      {count > 0 && (
        <Link href={href} className="mt-3 inline-block text-xs text-cyan-400 hover:underline">
          View all →
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = createClient();
  const portfolioId = getSelectedPortfolio();
  const buildingIds = await getBuildingIdsForPortfolio(supabase, portfolioId);
  const { data: selectedPortfolioRow } =
    portfolioId === "all"
      ? { data: null }
      : await supabase.from("portfolios").select("name").eq("id", portfolioId).maybeSingle();
  const scoped = (query: any) =>
    buildingIds ? query.in("building_id", buildingIds) : query;

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const nextMonthStart = new Date(
    new Date(monthStart).getFullYear(),
    new Date(monthStart).getMonth() + 1,
    1
  )
    .toISOString()
    .slice(0, 10);

  const [
    buildingsRes,
    tenantsRes,
    openActionsRes,
    arrearsRes,
    upcomingDatesRes,
    recentComments,
    overdueArrearsRes,
    overdueActionsRes,
    turnoverRequiredTenantsRes,
    turnoversThisMonthRes,
    siteVisitItemsRes,
  ] = await Promise.all([
    buildingIds
      ? supabase.from("buildings").select("id", { count: "exact", head: true }).in("id", buildingIds)
      : supabase.from("buildings").select("id", { count: "exact", head: true }),
    scoped(supabase.from("tenants").select("id", { count: "exact", head: true })),
    scoped(
      supabase
        .from("action_items")
        .select("id", { count: "exact", head: true })
        .neq("status", "complete")
    ),
    scoped(supabase.from("arrears_current").select("current_balance")),
    scoped(
      supabase
        .from("important_dates")
        .select("id, title, due_date, buildings(name)")
        .neq("status", "complete")
        .order("due_date", { ascending: true })
        .limit(6)
    ),
    scoped(
      supabase
        .from("arrears_comments")
        .select("id, comment, created_at, tenants(trading_name), buildings(name)")
        .order("created_at", { ascending: false })
        .limit(6)
    ),
    scoped(
      supabase
        .from("arrears_current")
        .select("id, tenant_id, current_balance, tenants(trading_name), buildings(name)")
        .eq("risk", true)
        .gt("current_balance", 0)
        .order("current_balance", { ascending: false })
    ),
    scoped(
      supabase
        .from("action_items")
        .select("id, title, due_date, building_id, tenant_id, buildings(name), tenants(trading_name)")
        .neq("status", "complete")
        .lt("due_date", today)
        .order("due_date", { ascending: true })
    ),
    scoped(
      supabase
        .from("tenants")
        .select("id, trading_name, building_id, buildings(name)")
        .eq("monthly_turnover_required", true)
        .is("archived_at", null)
    ),
    scoped(
      supabase
        .from("turnovers")
        .select("tenant_id")
        .gte("period", monthStart)
        .lt("period", nextMonthStart)
    ),
    supabase
      .from("site_visit_items")
      .select(
        "id, description, risk_level, status, site_visit_id, site_visits(building_id, buildings(name))"
      )
      .in("risk_level", ["high", "critical"])
      .neq("status", "resolved"),
  ]);

  const totalArrears = (arrearsRes.data ?? []).reduce(
    (sum: number, row: any) => sum + Number(row.current_balance ?? 0),
    0
  );

  const submittedTenantIds = new Set((turnoversThisMonthRes.data ?? []).map((t: any) => t.tenant_id));
  const missingTurnovers = (turnoverRequiredTenantsRes.data ?? []).filter(
    (t: any) => !submittedTenantIds.has(t.id)
  );

  const highRiskSiteVisitItems = (siteVisitItemsRes.data ?? []).filter((i: any) => {
    const bId = i.site_visits?.building_id;
    return buildingIds ? bId && buildingIds.includes(bId) : true;
  });

  const stats = [
    { label: "Buildings", value: buildingsRes.count ?? 0, href: "/dashboard/buildings" },
    { label: "Tenants", value: tenantsRes.count ?? 0, href: "/dashboard/tenants" },
    { label: "Open Actions", value: openActionsRes.count ?? 0, href: "/dashboard/actions" },
    {
      label: "Total Arrears",
      value: formatCurrency(totalArrears),
      href: "/dashboard/arrears",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          portfolioId === "all"
            ? "All portfolios"
            : `Portfolio: ${selectedPortfolioRow?.name ?? "Unknown"}`
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card block hover:border-cyan-500/50">
            <p className="text-xs uppercase tracking-wide text-charcoal-400">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-charcoal-100">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        Risk &amp; Compliance Exceptions
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExceptionCard
          title="Flagged Arrears"
          count={overdueArrearsRes.data?.length ?? 0}
          href="/dashboard/arrears"
        >
          {(overdueArrearsRes.data ?? []).slice(0, 5).map((r: any) => (
            <li key={r.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-charcoal-100">{r.tenants?.trading_name ?? "Unknown tenant"}</p>
                <p className="text-xs text-charcoal-400">{r.buildings?.name}</p>
              </div>
              <span className="text-status-risk">{formatCurrency(r.current_balance)}</span>
            </li>
          ))}
        </ExceptionCard>

        <ExceptionCard
          title="Missing Turnover Submissions"
          count={missingTurnovers.length}
          href="/dashboard/turnovers"
        >
          {missingTurnovers.slice(0, 5).map((t: any) => (
            <li key={t.id} className="flex items-center justify-between text-sm">
              <p className="text-charcoal-100">{t.trading_name}</p>
              <p className="text-xs text-charcoal-400">{t.buildings?.name}</p>
            </li>
          ))}
        </ExceptionCard>

        <ExceptionCard
          title="High-Risk Site Visit Items"
          count={highRiskSiteVisitItems.length}
          href="/dashboard/site-visits"
        >
          {highRiskSiteVisitItems.slice(0, 5).map((i: any) => (
            <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="line-clamp-1 text-charcoal-100">{i.description}</p>
                <p className="text-xs text-charcoal-400">{i.site_visits?.buildings?.name}</p>
              </div>
              <Badge label={enumLabel(i.risk_level)} className={RISK_SEVERITY_CLASSES[i.risk_level] ?? ""} />
            </li>
          ))}
        </ExceptionCard>

        <ExceptionCard
          title="Overdue Actions"
          count={overdueActionsRes.data?.length ?? 0}
          href="/dashboard/actions"
        >
          {(overdueActionsRes.data ?? []).slice(0, 5).map((a: any) => (
            <li key={a.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-charcoal-100">{a.title}</p>
                <p className="text-xs text-charcoal-400">
                  {a.tenants?.trading_name ?? a.buildings?.name ?? "—"}
                </p>
              </div>
              <span className="text-xs text-status-risk">{formatDate(a.due_date)}</span>
            </li>
          ))}
        </ExceptionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-charcoal-100">
            Upcoming Dates
          </h2>
          {upcomingDatesRes.data && upcomingDatesRes.data.length > 0 ? (
            <ul className="space-y-3">
              {upcomingDatesRes.data.map((d: any) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-charcoal-100">{d.title}</p>
                    <p className="text-xs text-charcoal-400">{d.buildings?.name}</p>
                  </div>
                  <span className="text-xs text-charcoal-300">
                    {formatDate(d.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">Nothing scheduled.</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-charcoal-100">
            Recent Arrears Activity
          </h2>
          {recentComments.data && recentComments.data.length > 0 ? (
            <ul className="space-y-3">
              {recentComments.data.map((c: any) => (
                <li key={c.id} className="text-sm">
                  <p className="text-charcoal-100">
                    {c.tenants?.trading_name ?? "Unknown tenant"}
                  </p>
                  <p className="line-clamp-1 text-xs text-charcoal-400">{c.comment}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
}
