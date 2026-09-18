import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency } from "@/lib/format";

export default async function ReportsPage() {
  const supabase = createClient();
  const portfolioId = getSelectedPortfolio();

  let buildingIds: string[] | null = null;
  if (portfolioId !== "all") {
    const { data } = await supabase.from("buildings").select("id").eq("portfolio_id", portfolioId);
    buildingIds = (data ?? []).map((b) => b.id);
  }
  const scope = (q: any) => (buildingIds ? q.in("building_id", buildingIds) : q);
  const scopeById = (q: any) => (buildingIds ? q.in("id", buildingIds) : q);

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
    buildingsCount,
    tenantsCount,
    arrearsRes,
    expiringLeasesRes,
    openActionsCount,
    turnoverRequiredTenantsRes,
    turnoversThisMonthRes,
    outstandingCertsCount,
    highRiskSiteVisitItemsRes,
    meetingsCount,
  ] = await Promise.all([
    scopeById(supabase.from("buildings").select("id", { count: "exact", head: true }).is("archived_at", null)),
    scope(supabase.from("tenants").select("id", { count: "exact", head: true }).is("archived_at", null)),
    scope(supabase.from("arrears_current").select("current_balance")),
    scope(
      supabase
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .lte("lease_end", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    ),
    scope(supabase.from("action_items").select("id", { count: "exact", head: true }).neq("status", "complete")),
    scope(
      supabase
        .from("tenants")
        .select("id")
        .eq("monthly_turnover_required", true)
        .is("archived_at", null)
    ),
    scope(
      supabase
        .from("turnovers")
        .select("tenant_id")
        .gte("period", monthStart)
        .lt("period", nextMonthStart)
    ),
    scope(
      supabase
        .from("turnover_annual_certificates")
        .select("id", { count: "exact", head: true })
        .neq("status", "received")
    ),
    supabase
      .from("site_visit_items")
      .select("id, site_visits(building_id)")
      .in("risk_level", ["high", "critical"])
      .neq("status", "resolved"),
    scope(supabase.from("meetings").select("id", { count: "exact", head: true }).is("archived_at", null)),
  ]);

  const totalArrears = (arrearsRes.data ?? []).reduce(
    (sum: number, r: any) => sum + Number(r.current_balance ?? 0),
    0
  );

  const submittedTenantIds = new Set((turnoversThisMonthRes.data ?? []).map((t: any) => t.tenant_id));
  const missingTurnovers = (turnoverRequiredTenantsRes.data ?? []).filter(
    (t: any) => !submittedTenantIds.has(t.id)
  ).length;

  const highRiskSiteVisitItems = (highRiskSiteVisitItemsRes.data ?? []).filter((i: any) => {
    const bId = i.site_visits?.building_id;
    return buildingIds ? bId && buildingIds.includes(bId) : true;
  }).length;

  const reports = [
    {
      title: "Arrears Report",
      description: "Outstanding balances by tenant and building, exportable to PDF or Excel.",
      href: "/dashboard/arrears",
      stat: formatCurrency(totalArrears),
    },
    {
      title: "Tenant Schedule",
      description: `${tenantsCount.count ?? 0} tenants across ${buildingsCount.count ?? 0} buildings.`,
      href: "/dashboard/tenants",
      stat: `${tenantsCount.count ?? 0} tenants`,
    },
    {
      title: "Lease Expiries (90 days)",
      description: "Tenants with leases expiring in the next 90 days.",
      href: "/dashboard/tenants",
      stat: `${expiringLeasesRes.count ?? 0} expiring`,
    },
    {
      title: "Open Actions",
      description: "Outstanding action items across the portfolio.",
      href: "/dashboard/actions",
      stat: `${openActionsCount.count ?? 0} open`,
    },
    {
      title: "Turnover Compliance",
      description: `${missingTurnovers} tenant(s) missing this month's submission, ${outstandingCertsCount.count ?? 0} annual certificate(s) outstanding.`,
      href: "/dashboard/turnovers",
      stat: `${missingTurnovers} missing`,
    },
    {
      title: "Site Visit Risk Register",
      description: "Open inspection findings flagged high risk or critical.",
      href: "/dashboard/site-visits",
      stat: `${highRiskSiteVisitItems} open`,
    },
    {
      title: "Meetings Log",
      description: "Full meeting history, searchable by title, building or attendee.",
      href: "/dashboard/meetings",
      stat: `${meetingsCount.count ?? 0} meetings`,
    },
  ];

  return (
    <div>
      <PageHeader title="Reports" description="Portfolio-level summaries and export-ready reports" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reports.map((report) => (
          <Link key={report.title} href={report.href} className="card block hover:border-cyan-500/50">
            <p className="text-xs uppercase tracking-wide text-charcoal-400">{report.title}</p>
            <p className="mt-2 text-xl font-semibold text-charcoal-100">{report.stat}</p>
            <p className="mt-2 text-sm text-charcoal-300">{report.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
