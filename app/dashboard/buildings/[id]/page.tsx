import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge, Badge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatNumber } from "@/lib/format";
import { computeMonthlyStatus, STATUS_LABELS, STATUS_CLASSES } from "@/lib/turnovers";
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

  const { data: portfolios } = await supabase.from("portfolios").select("id, name").order("name");

  const [tenantsRes, actionsRes, arrearsRes, siteVisitsRes, turnoversRes, meetingsRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, trading_name, shop_number, monthly_rental, status")
      .eq("building_id", params.id)
      .is("archived_at", null)
      .order("shop_number"),
    supabase
      .from("action_items")
      .select("id, title, priority, status, due_date, tenant_id, meeting_id")
      .eq("building_id", params.id)
      .neq("status", "complete")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("arrears_current")
      .select("id, tenant_id, current_balance, tenants(trading_name)")
      .eq("building_id", params.id)
      .gt("current_balance", 0)
      .order("current_balance", { ascending: false }),
    supabase
      .from("site_visits")
      .select("id, visit_date, observations, status")
      .eq("building_id", params.id)
      .order("visit_date", { ascending: false })
      .limit(5),
    supabase
      .from("turnovers")
      .select("id, tenant_id, due_date, submitted, status, period, tenants(trading_name)")
      .eq("building_id", params.id)
      .order("period", { ascending: false })
      .limit(5),
    supabase
      .from("meetings")
      .select("id, title, meeting_type, meeting_date, status")
      .eq("building_id", params.id)
      .order("meeting_date", { ascending: false })
      .limit(5),
  ]);

  const totalArrears = (arrearsRes.data ?? []).reduce(
    (sum: number, row: any) => sum + Number(row.current_balance ?? 0),
    0
  );

  return (
    <div>
      <PageHeader
        title={building.name}
        description={building.address ?? undefined}
        action={
          <BuildingFormButton building={building} label="Edit Building" portfolios={portfolios ?? []} />
        }
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
              {tenantsRes.data.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <Link href={`/dashboard/tenants/${t.id}`} className="text-cyan-400 hover:underline">
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Open Actions</h2>
            <Link
              href={`/dashboard/actions?building_id=${building.id}`}
              className="text-xs text-cyan-400 hover:underline"
            >
              View all →
            </Link>
          </div>
          {actionsRes.data && actionsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {actionsRes.data.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {a.tenant_id ? (
                      <Link href={`/dashboard/tenants/${a.tenant_id}`} className="text-cyan-400 hover:underline">
                        {a.title}
                      </Link>
                    ) : (
                      <span>{a.title}</span>
                    )}
                    {a.meeting_id && (
                      <Link
                        href={`/dashboard/meetings/${a.meeting_id}`}
                        className="text-xs text-charcoal-400 hover:underline"
                      >
                        (from meeting)
                      </Link>
                    )}
                  </div>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Arrears</h2>
            <Link
              href={`/dashboard/arrears?building_id=${building.id}`}
              className="text-xs text-cyan-400 hover:underline"
            >
              View all →
            </Link>
          </div>
          {arrearsRes.data && arrearsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {arrearsRes.data.map((row: any) => (
                <li key={row.id} className="flex items-center justify-between text-sm">
                  {row.tenant_id ? (
                    <Link href={`/dashboard/tenants/${row.tenant_id}`} className="text-cyan-400 hover:underline">
                      {row.tenants?.trading_name ?? "Unknown tenant"}
                    </Link>
                  ) : (
                    <span>{row.tenants?.trading_name ?? "Unknown tenant"}</span>
                  )}
                  <span className="text-status-risk">{formatCurrency(row.current_balance)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No tenants in arrears.</p>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Turnovers</h2>
            <Link
              href={`/dashboard/turnovers?building_id=${building.id}`}
              className="text-xs text-cyan-400 hover:underline"
            >
              View all →
            </Link>
          </div>
          {turnoversRes.data && turnoversRes.data.length > 0 ? (
            <ul className="space-y-2">
              {turnoversRes.data.map((t: any) => {
                const computed = computeMonthlyStatus(t.due_date, t.submitted, t.status);
                return (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    {t.tenant_id ? (
                      <Link href={`/dashboard/tenants/${t.tenant_id}`} className="text-cyan-400 hover:underline">
                        {t.tenants?.trading_name ?? "Unknown tenant"}
                      </Link>
                    ) : (
                      <span>{t.tenants?.trading_name ?? "Unknown tenant"}</span>
                    )}
                    <Badge
                      label={STATUS_LABELS[computed as keyof typeof STATUS_LABELS]}
                      className={STATUS_CLASSES[computed as keyof typeof STATUS_CLASSES]}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No turnover records yet.</p>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Meetings</h2>
            <Link
              href={`/dashboard/meetings?building_id=${building.id}`}
              className="text-xs text-cyan-400 hover:underline"
            >
              View all →
            </Link>
          </div>
          {meetingsRes.data && meetingsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {meetingsRes.data.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <Link href={`/dashboard/meetings/${m.id}`} className="text-cyan-400 hover:underline">
                    {m.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-charcoal-400">{formatDate(m.meeting_date)}</span>
                    <StatusBadge status={m.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No meetings recorded.</p>
          )}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Site Visits</h2>
            <Link
              href={`/dashboard/site-visits?building_id=${building.id}`}
              className="text-xs text-cyan-400 hover:underline"
            >
              View all →
            </Link>
          </div>
          {siteVisitsRes.data && siteVisitsRes.data.length > 0 ? (
            <ul className="space-y-2">
              {siteVisitsRes.data.map((v: any) => (
                <li key={v.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <Link href={`/dashboard/site-visits/${v.id}`} className="text-cyan-400 hover:underline">
                      {formatDate(v.visit_date)}
                    </Link>
                    <StatusBadge status={v.status} />
                  </div>
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
