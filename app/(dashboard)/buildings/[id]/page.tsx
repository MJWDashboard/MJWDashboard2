import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { BuildingFormButton } from "../BuildingForm";

export default async function BuildingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: building } = await supabase
    .from("buildings")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!building) notFound();

  const [tenantsRes, actionsRes, arrearsRes, siteVisitsRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, trading_name, shop_number, monthly_rental, status")
      .eq("building_id", params.id)
      .is("archived_at", null)
      .order("shop_number"),
    supabase
      .from("action_items")
      .select("id, title, priority, status, due_date")
      .eq("building_id", params.id)
      .neq("status", "complete")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("arrears_current")
      .select("current_balance, tenants(trading_name)")
      .eq("building_id", params.id)
      .gt("current_balance", 0)
      .order("current_balance", { ascending: false }),
    supabase
      .from("site_visits")
      .select("id, visit_date, observations")
      .eq("building_id", params.id)
      .order("visit_date", { ascending: false })
      .limit(5),
  ]);

  const totalArrears = (arrearsRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.current_balance ?? 0),
    0
  );

  return (
    <div>
      <PageHeader
        title={building.name}
        description={building.address ?? undefined}
        action={<BuildingFormButton building={building} label="Edit Building" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">GLA</p>
          <p className="mt-1 text-lg font-semibold">{formatNumber(building.gla)} m²</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Budget</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(building.budget)}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Tenants</p>
          <p className="mt-1 text-lg font-semibold">{tenantsRes.data?.length ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-charcoal-400">Arrears</p>
          <p className="mt-1 text-lg font-semibold text-status-risk">
            {formatCurrency(totalArrears)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Tenants</h2>
          {tenantsRes.data && tenantsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {tenantsRes.data.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <Link href={`/tenants/${t.id}`} className="text-cyan-400 hover:underline">
                    {t.trading_name} {t.shop_number ? `· ${t.shop_number}` : ""}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-charcoal-300">{formatCurrency(t.monthly_rental)}</span>
                    <StatusBadge status={t.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No tenants recorded.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Open Actions</h2>
          {actionsRes.data && actionsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {actionsRes.data.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-charcoal-400">{formatDate(a.due_date)}</span>
                    <StatusBadge status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No open actions.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Arrears</h2>
          {arrearsRes.data && arrearsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {arrearsRes.data.map((row: any, i: number) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span>{row.tenants?.trading_name ?? "Unknown tenant"}</span>
                  <span className="text-status-risk">{formatCurrency(row.current_balance)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No tenants in arrears.</p>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Recent Site Visits</h2>
          {siteVisitsRes.data && siteVisitsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {siteVisitsRes.data.map((v) => (
                <li key={v.id} className="text-sm">
                  <p className="text-charcoal-100">{formatDate(v.visit_date)}</p>
                  <p className="line-clamp-1 text-xs text-charcoal-400">
                    {v.observations ?? "No notes."}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No site visits recorded.</p>
          )}
        </section>
      </div>
    </div>
  );
}
