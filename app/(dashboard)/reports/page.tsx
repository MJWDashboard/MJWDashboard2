import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { formatCurrency } from "@/lib/format";

export default async function ReportsPage() {
  const supabase = createClient();

  const [buildingsCount, tenantsCount, arrearsRes, expiringLeasesRes, openActionsCount] =
    await Promise.all([
      supabase.from("buildings").select("id", { count: "exact", head: true }).is("archived_at", null),
      supabase.from("tenants").select("id", { count: "exact", head: true }).is("archived_at", null),
      supabase.from("arrears_current").select("current_balance"),
      supabase
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .lte("lease_end", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
      supabase
        .from("action_items")
        .select("id", { count: "exact", head: true })
        .neq("status", "complete"),
    ]);

  const totalArrears = (arrearsRes.data ?? []).reduce(
    (sum: number, r: any) => sum + Number(r.current_balance ?? 0),
    0
  );

  const reports = [
    {
      title: "Arrears Report",
      description: "Outstanding balances by tenant and building, exportable to PDF or Excel.",
      href: "/arrears",
      stat: formatCurrency(totalArrears),
    },
    {
      title: "Tenant Schedule",
      description: `${tenantsCount.count ?? 0} tenants across ${buildingsCount.count ?? 0} buildings.`,
      href: "/tenants",
      stat: `${tenantsCount.count ?? 0} tenants`,
    },
    {
      title: "Lease Expiries (90 days)",
      description: "Tenants with leases expiring in the next 90 days.",
      href: "/tenants",
      stat: `${expiringLeasesRes.count ?? 0} expiring`,
    },
    {
      title: "Open Actions",
      description: "Outstanding action items across the portfolio.",
      href: "/actions",
      stat: `${openActionsCount.count ?? 0} open`,
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
