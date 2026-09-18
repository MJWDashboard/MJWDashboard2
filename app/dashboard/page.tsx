import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency, formatDate } from "@/lib/format";

async function getBuildingIdsForPortfolio(
  supabase: ReturnType<typeof createClient>,
  portfolio: string
) {
  if (portfolio === "all") return null;
  const { data } = await supabase
    .from("buildings")
    .select("id")
    .eq("portfolio", portfolio);
  return (data ?? []).map((b) => b.id);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const portfolio = getSelectedPortfolio();
  const buildingIds = await getBuildingIdsForPortfolio(supabase, portfolio);
  const scoped = (query: any) =>
    buildingIds ? query.in("building_id", buildingIds) : query;

  const [
    buildingsRes,
    tenantsRes,
    openActionsRes,
    arrearsRes,
    upcomingDatesRes,
    recentComments,
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
  ]);

  const totalArrears = (arrearsRes.data ?? []).reduce(
    (sum: number, row: any) => sum + Number(row.current_balance ?? 0),
    0
  );

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
          portfolio === "all" ? "All portfolios" : `Portfolio: ${portfolio}`
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
