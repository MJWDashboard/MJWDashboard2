"use server";

import { createClient } from "@/lib/supabase/server";
import { getSelectedPortfolio } from "@/lib/portfolio";

export type SearchResult = {
  type: string;
  id: string;
  label: string;
  sublabel: string | null;
  href: string;
};

export async function globalSearch(rawQuery: string): Promise<SearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const supabase = createClient();
  const term = `%${query}%`;
  const portfolioId = getSelectedPortfolio();

  let buildingIds: string[] | null = null;
  if (portfolioId !== "all") {
    const { data } = await supabase.from("buildings").select("id").eq("portfolio_id", portfolioId);
    buildingIds = (data ?? []).map((b) => b.id);
  }

  const scope = (q: any) => (buildingIds ? q.in("building_id", buildingIds) : q);

  const [tenants, buildings, contacts, meetings, arrears, actions, documents, siteVisits] =
    await Promise.all([
      scope(
        supabase
          .from("tenants")
          .select("id, trading_name, shop_number, buildings(name)")
          .is("archived_at", null)
          .ilike("trading_name", term)
      ).limit(6),
      (buildingIds
        ? supabase.from("buildings").select("id, name, address").in("id", buildingIds)
        : supabase.from("buildings").select("id, name, address")
      )
        .is("archived_at", null)
        .ilike("name", term)
        .limit(6),
      supabase
        .from("contacts")
        .select("id, name, company, type")
        .is("archived_at", null)
        .ilike("name", term)
        .limit(6),
      scope(
        supabase
          .from("meetings")
          .select("id, title, meeting_date, buildings(name)")
          .is("archived_at", null)
          .ilike("title", term)
      ).limit(6),
      scope(
        supabase
          .from("arrears_current")
          .select("id, tenant_id, debtor_name, current_balance, tenants(trading_name), buildings(name)")
          .ilike("debtor_name", term)
      ).limit(6),
      scope(
        supabase
          .from("action_items")
          .select("id, title, building_id, tenant_id, buildings(name), tenants(trading_name)")
          .is("archived_at", null)
          .ilike("title", term)
      ).limit(6),
      scope(
        supabase
          .from("documents")
          .select("id, file_name, building_id, tenant_id, buildings(name), tenants(trading_name)")
          .is("archived_at", null)
          .ilike("file_name", term)
      ).limit(6),
      scope(
        supabase
          .from("site_visits")
          .select("id, visit_type, visit_date, buildings(name)")
          .ilike("visit_type", term)
      ).limit(6),
    ]);

  const results: SearchResult[] = [];

  for (const t of tenants.data ?? []) {
    results.push({
      type: "Tenant",
      id: t.id,
      label: t.trading_name,
      sublabel: [t.buildings?.name, t.shop_number].filter(Boolean).join(" · ") || null,
      href: `/dashboard/tenants/${t.id}`,
    });
  }
  for (const b of buildings.data ?? []) {
    results.push({
      type: "Building",
      id: b.id,
      label: b.name,
      sublabel: b.address,
      href: `/dashboard/buildings/${b.id}`,
    });
  }
  for (const c of contacts.data ?? []) {
    results.push({
      type: "Contact",
      id: c.id,
      label: c.name,
      sublabel: [c.company, c.type].filter(Boolean).join(" · ") || null,
      href: `/dashboard/contacts`,
    });
  }
  for (const m of meetings.data ?? []) {
    results.push({
      type: "Meeting",
      id: m.id,
      label: m.title,
      sublabel: m.buildings?.name ?? null,
      href: `/dashboard/meetings/${m.id}`,
    });
  }
  for (const a of arrears.data ?? []) {
    results.push({
      type: "Arrears",
      id: a.id,
      label: a.tenants?.trading_name ?? a.debtor_name ?? "Unknown debtor",
      sublabel: a.buildings?.name ?? null,
      href: a.tenant_id ? `/dashboard/tenants/${a.tenant_id}` : `/dashboard/arrears`,
    });
  }
  for (const a of actions.data ?? []) {
    results.push({
      type: "Action",
      id: a.id,
      label: a.title,
      sublabel: a.tenants?.trading_name ?? a.buildings?.name ?? null,
      href: `/dashboard/actions`,
    });
  }
  for (const d of documents.data ?? []) {
    results.push({
      type: "Document",
      id: d.id,
      label: d.file_name,
      sublabel: d.tenants?.trading_name ?? d.buildings?.name ?? null,
      href: `/dashboard/documents`,
    });
  }
  for (const v of siteVisits.data ?? []) {
    results.push({
      type: "Site Visit",
      id: v.id,
      label: v.visit_type ?? "Site Visit",
      sublabel: v.buildings?.name ?? null,
      href: `/dashboard/site-visits/${v.id}`,
    });
  }

  return results;
}
