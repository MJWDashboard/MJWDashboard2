import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";
import { getSelectedBuilding } from "@/lib/building";
import { PageHeader } from "@/components/PageHeader";
import { FilterChip } from "@/components/FilterChip";
import { LeasingTabs } from "./LeasingTabs";

export default async function LeasingPage({
  searchParams,
}: {
  searchParams: { building_id?: string };
}) {
  const supabase = createClient();
  const portfolioId = getSelectedPortfolio();
  const selectedBuilding = getSelectedBuilding();
  const buildingId = searchParams.building_id ?? (selectedBuilding !== "all" ? selectedBuilding : undefined);

  const { data: buildings } = await supabase
    .from("buildings")
    .select("id, name, portfolio_id")
    .is("archived_at", null)
    .order("name");

  const scopedIds =
    portfolioId === "all"
      ? null
      : (buildings ?? []).filter((b) => b.portfolio_id === portfolioId).map((b) => b.id);

  const applyScope = (query: any) => {
    if (buildingId) return query.eq("building_id", buildingId);
    if (scopedIds) return query.in("building_id", scopedIds);
    return query;
  };

  const today = new Date();
  const renewalCutoff = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 9, today.getUTCDate()))
    .toISOString()
    .slice(0, 10);

  const [
    { data: deals },
    { data: vacantUnits },
    { data: targets },
    { data: approvedRates },
    { data: templates },
    { data: tenants },
    { data: expiringLeases },
  ] = await Promise.all([
      applyScope(
        supabase
          .from("leasing_deals")
          .select(
            "id, building_id, tenant_id, prospect_name, shop_number, stage, deal_value, rate_per_sqm, buildings(name), tenants(trading_name)"
          )
          .is("archived_at", null)
          .order("created_at", { ascending: false })
      ),
      applyScope(
        supabase
          .from("vacant_units")
          .select("id, building_id, shop_number, size_sqm, asking_rate_per_sqm, availability_date, status, buildings(name)")
          .is("archived_at", null)
          .order("created_at", { ascending: false })
      ),
      applyScope(
        supabase
          .from("leasing_targets")
          .select("id, building_id, company_name, trade_category, contact_name, contact_email, contact_phone, status, buildings(name)")
          .is("archived_at", null)
          .order("created_at", { ascending: false })
      ),
      applyScope(
        supabase
          .from("leasing_approved_rates")
          .select("id, building_id, category, rate_per_sqm, effective_date, notes, buildings(name)")
          .is("archived_at", null)
          .order("category")
      ),
      supabase.from("leasing_document_templates").select("id, name, items").is("archived_at", null).order("name"),
      supabase.from("tenants").select("id, trading_name").is("archived_at", null).order("trading_name"),
      applyScope(
        supabase
          .from("leases")
          .select(
            "id, building_id, tenant_id, shop_number, lease_end, status, renewal_status, buildings(name), tenants(trading_name), lease_renewal_notes(id, comment, created_at)"
          )
          .eq("status", "active")
          .is("archived_at", null)
          .not("lease_end", "is", null)
          .lte("lease_end", renewalCutoff)
          .order("lease_end")
          .order("created_at", { foreignTable: "lease_renewal_notes", ascending: false })
      ),
    ]);

  const buildingOptions = (buildings ?? []).map((b) => ({ id: b.id, name: b.name }));

  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const renewals = (expiringLeases ?? []).map((l: any) => ({
    ...l,
    daysRemaining: Math.round((new Date(l.lease_end + "T00:00:00Z").getTime() - todayMs) / 86400000),
  }));

  return (
    <div>
      <PageHeader
        title="Leasing"
        description="Enquiries, vacancies, targets, rates and document requirements - one operational record per building"
      />

      {buildingId && (
        <FilterChip
          label={buildingOptions.find((b) => b.id === buildingId)?.name ?? "building"}
          clearHref="/dashboard/leasing"
        />
      )}

      <LeasingTabs
        deals={deals ?? []}
        vacantUnits={vacantUnits ?? []}
        targets={targets ?? []}
        approvedRates={approvedRates ?? []}
        templates={templates ?? []}
        renewals={renewals}
        buildings={buildingOptions}
        tenants={tenants ?? []}
      />
    </div>
  );
}
