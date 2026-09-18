import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export default async function TenantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*, buildings(id, name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!tenant) notFound();

  const [leasesRes, arrearsHistoryRes, actionsRes, turnoversRes, arrearsCurrentRes] =
    await Promise.all([
      supabase
        .from("leases")
        .select("id, lease_start, lease_end, base_rental, escalation_pct, status, option_period")
        .eq("tenant_id", params.id)
        .order("lease_start", { ascending: false }),
      supabase
        .from("arrears_history")
        .select("as_of_month, balance, days_30, days_60, days_90_plus")
        .eq("tenant_id", params.id)
        .order("as_of_month", { ascending: false })
        .limit(12),
      supabase
        .from("action_items")
        .select("id, title, status, priority, due_date")
        .eq("tenant_id", params.id)
        .neq("status", "complete"),
      supabase
        .from("turnovers")
        .select("period, turnover_amount, turnover_rental")
        .eq("tenant_id", params.id)
        .order("period", { ascending: false })
        .limit(12),
      supabase
        .from("arrears_current")
        .select("current_balance, days_30, days_60, days_90_plus")
        .eq("tenant_id", params.id)
        .maybeSingle(),
    ]);

  return (
    <div>
      <PageHeader
        title={tenant.trading_name}
        description={
          <>
            <Link href={`/buildings/${tenant.buildings?.id}`} className="text-cyan-400 hover:underline">
              {tenant.buildings?.name}
            </Link>
            {tenant.shop_number ? ` · Shop ${tenant.shop_number}` : ""}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Monthly Rental</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(tenant.monthly_rental)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">GLA</p>
          <p className="mt-1 text-lg font-semibold">{formatNumber(tenant.gla)} m²</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Lease End</p>
          <p className="mt-1 text-lg font-semibold">{formatDate(tenant.lease_end)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Current Arrears</p>
          <p className="mt-1 text-lg font-semibold text-status-risk">
            {formatCurrency((arrearsCurrentRes.data as any)?.current_balance ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Lease History</h2>
          {leasesRes.data && leasesRes.data.length > 0 ? (
            <ul className="space-y-3">
              {leasesRes.data.map((l: any) => (
                <li key={l.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>
                      {formatDate(l.lease_start)} – {formatDate(l.lease_end)}
                    </span>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="text-xs text-charcoal-400">
                    {formatCurrency(l.base_rental)} base
                    {l.escalation_pct ? ` · ${l.escalation_pct}% escalation` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No lease records.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Open Actions</h2>
          {actionsRes.data && actionsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {actionsRes.data.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.title}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No open actions.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Arrears History</h2>
          {arrearsHistoryRes.data && arrearsHistoryRes.data.length > 0 ? (
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {arrearsHistoryRes.data.map((row: any, i: number) => (
                  <tr key={i}>
                    <td>{formatDate(row.as_of_month)}</td>
                    <td>{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-charcoal-400">No arrears history.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Turnover Trend</h2>
          {turnoversRes.data && turnoversRes.data.length > 0 ? (
            <table className="table-base w-full">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Turnover</th>
                </tr>
              </thead>
              <tbody>
                {turnoversRes.data.map((row: any, i: number) => (
                  <tr key={i}>
                    <td>{formatDate(row.period)}</td>
                    <td>{formatCurrency(row.turnover_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-charcoal-400">No turnover records.</p>
          )}
        </section>
      </div>
    </div>
  );
}
