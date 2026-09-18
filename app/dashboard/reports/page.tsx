import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { getSelectedBuilding } from "@/lib/building";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency } from "@/lib/format";
import { PortfolioBreakdown } from "./PortfolioBreakdown";

export default async function ReportsPage() {
  const supabase = createClient();
  const portfolioId = getSelectedPortfolio();
  const selectedBuilding = getSelectedBuilding();

  let buildingIds: string[] | null = null;
  if (selectedBuilding !== "all") {
    buildingIds = [selectedBuilding];
  } else if (portfolioId !== "all") {
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

  // Per-portfolio / per-building breakdown - deliberately ignores the top-nav
  // portfolio filter above and instead shows everything RLS lets this user
  // see, so a portfolio manager gets full oversight regardless of which
  // portfolio happens to be selected.
  const [
    { data: allBuildings },
    { data: allArrears },
    { data: allTenants },
    { data: allTurnoversThisMonth },
    { data: allOpenActions },
    { data: allHighRiskItems },
  ] = await Promise.all([
    supabase
      .from("buildings")
      .select("id, name, portfolio_id, portfolios(name)")
      .is("archived_at", null)
      .order("name"),
    supabase.from("arrears_current").select("building_id, current_balance"),
    supabase
      .from("tenants")
      .select("id, building_id, monthly_turnover_required")
      .is("archived_at", null),
    supabase
      .from("turnovers")
      .select("tenant_id, building_id")
      .gte("period", monthStart)
      .lt("period", nextMonthStart),
    supabase.from("action_items").select("building_id").neq("status", "complete"),
    supabase
      .from("site_visit_items")
      .select("id, site_visits(building_id)")
      .in("risk_level", ["high", "critical"])
      .neq("status", "resolved"),
  ]);

  const arrearsByBuilding = new Map<string, number>();
  for (const r of allArrears ?? []) {
    arrearsByBuilding.set(r.building_id, (arrearsByBuilding.get(r.building_id) ?? 0) + Number(r.current_balance ?? 0));
  }

  const tenantCountByBuilding = new Map<string, number>();
  const turnoverRequiredByBuilding = new Map<string, Set<string>>();
  for (const t of allTenants ?? []) {
    if (!t.building_id) continue;
    tenantCountByBuilding.set(t.building_id, (tenantCountByBuilding.get(t.building_id) ?? 0) + 1);
    if (t.monthly_turnover_required) {
      if (!turnoverRequiredByBuilding.has(t.building_id)) turnoverRequiredByBuilding.set(t.building_id, new Set());
      turnoverRequiredByBuilding.get(t.building_id)!.add(t.id);
    }
  }

  const submittedTenantIdsByBuilding = new Map<string, Set<string>>();
  for (const t of allTurnoversThisMonth ?? []) {
    if (!t.building_id) continue;
    if (!submittedTenantIdsByBuilding.has(t.building_id)) submittedTenantIdsByBuilding.set(t.building_id, new Set());
    submittedTenantIdsByBuilding.get(t.building_id)!.add(t.tenant_id);
  }

  const openActionsByBuilding = new Map<string, number>();
  for (const a of allOpenActions ?? []) {
    if (!a.building_id) continue;
    openActionsByBuilding.set(a.building_id, (openActionsByBuilding.get(a.building_id) ?? 0) + 1);
  }

  const highRiskByBuilding = new Map<string, number>();
  for (const i of (allHighRiskItems ?? []) as any[]) {
    const bId = i.site_visits?.building_id;
    if (!bId) continue;
    highRiskByBuilding.set(bId, (highRiskByBuilding.get(bId) ?? 0) + 1);
  }

  const portfolioGroups = new Map<
    string,
    { portfolioName: string; buildings: { id: string; name: string; tenants: number; arrears: number; missingTurnovers: number; openActions: number; highRiskItems: number }[] }
  >();

  for (const b of (allBuildings ?? []) as any[]) {
    const portfolioName = b.portfolios?.name ?? "Unassigned Portfolio";
    if (!portfolioGroups.has(b.portfolio_id)) {
      portfolioGroups.set(b.portfolio_id, { portfolioName, buildings: [] });
    }
    const required = turnoverRequiredByBuilding.get(b.id) ?? new Set<string>();
    const submitted = submittedTenantIdsByBuilding.get(b.id) ?? new Set<string>();
    const missingTurnovers = Array.from(required).filter((id) => !submitted.has(id)).length;

    portfolioGroups.get(b.portfolio_id)!.buildings.push({
      id: b.id,
      name: b.name,
      tenants: tenantCountByBuilding.get(b.id) ?? 0,
      arrears: arrearsByBuilding.get(b.id) ?? 0,
      missingTurnovers,
      openActions: openActionsByBuilding.get(b.id) ?? 0,
      highRiskItems: highRiskByBuilding.get(b.id) ?? 0,
    });
  }

  const breakdown = Array.from(portfolioGroups.values()).sort((a, b) =>
    a.portfolioName.localeCompare(b.portfolioName)
  );

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

      <div className="mt-8">
        <PortfolioBreakdown groups={breakdown} />
      </div>
    </div>
  );
}
