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

  const [{ data: deals }, { data: vacantUnits }, { data: targets }, { data: approvedRates }, { data: templates }, { data: tenants }] =
    await Promise.all([
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
    ]);

  const buildingOptions = (buildings ?? []).map((b) => ({ id: b.id, name: b.name }));

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
        buildings={buildingOptions}
        tenants={tenants ?? []}
      />
    </div>
  );
}
