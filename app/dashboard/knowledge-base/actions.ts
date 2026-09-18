"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { formatCurrency, formatDate } from "@/lib/format";

export type ArticleInput = {
  title: string;
  building_id: string;
  category: string;
  content: string;
};

export async function createArticle(input: ArticleInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("knowledge_base_articles").insert({
    title: input.title,
    building_id: input.building_id || null,
    category: input.category || null,
    content: input.content,
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/knowledge-base");
  return { error: null };
}

export async function updateArticle(id: string, input: ArticleInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("knowledge_base_articles")
    .update({
      title: input.title,
      building_id: input.building_id || null,
      category: input.category || null,
      content: input.content,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/knowledge-base");
  return { error: null };
}

export async function generateHandoverSummary(buildingId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();

  const [{ data: building }, { data: tenants }, { data: contacts }, { data: contractors }, { data: openActions }, { data: arrears }] =
    await Promise.all([
      supabase.from("buildings").select("*, portfolios(name)").eq("id", buildingId).maybeSingle(),
      supabase
        .from("tenants")
        .select("trading_name, shop_number, monthly_rental, lease_end, status")
        .eq("building_id", buildingId)
        .is("archived_at", null),
      supabase
        .from("contacts")
        .select("name, type, company, email, phone")
        .eq("building_id", buildingId)
        .is("archived_at", null),
      supabase
        .from("contractor_buildings")
        .select("contractors(company_name, contact_name, trade, rating, phone)")
        .eq("building_id", buildingId),
      supabase
        .from("action_items")
        .select("title, priority, due_date")
        .eq("building_id", buildingId)
        .neq("status", "complete"),
      supabase
        .from("arrears_current")
        .select("current_balance, tenants(trading_name)")
        .eq("building_id", buildingId)
        .gt("current_balance", 0),
    ]);

  if (!building) return { error: "Building not found." };

  const totalArrears = (arrears ?? []).reduce((sum: number, r: any) => sum + Number(r.current_balance ?? 0), 0);

  const lines: string[] = [];
  lines.push(`# Handover Summary — ${building.name}`);
  lines.push("");
  lines.push(`Generated ${formatDate(new Date().toISOString())}`);
  lines.push("");
  lines.push(`## Overview`);
  lines.push(`- Address: ${building.address ?? "—"}`);
  lines.push(`- GLA: ${building.gla ?? "—"} m²`);
  lines.push(`- Budget: ${formatCurrency(building.budget)}`);
  lines.push(`- Portfolio: ${(building as any).portfolios?.name ?? "—"}`);
  lines.push("");
  lines.push(`## Tenants (${tenants?.length ?? 0})`);
  for (const t of tenants ?? []) {
    lines.push(
      `- ${t.trading_name}${t.shop_number ? ` (Shop ${t.shop_number})` : ""} — ${formatCurrency(t.monthly_rental)}/mo, lease ends ${formatDate(t.lease_end)}, status: ${t.status}`
    );
  }
  lines.push("");
  lines.push(`## Arrears (Total: ${formatCurrency(totalArrears)})`);
  for (const a of arrears ?? []) {
    lines.push(`- ${(a as any).tenants?.trading_name ?? "Unknown"}: ${formatCurrency(a.current_balance)}`);
  }
  lines.push("");
  lines.push(`## Open Actions (${openActions?.length ?? 0})`);
  for (const a of openActions ?? []) {
    lines.push(`- [${a.priority}] ${a.title} — due ${formatDate(a.due_date)}`);
  }
  lines.push("");
  lines.push(`## Key Contacts`);
  for (const c of contacts ?? []) {
    lines.push(`- ${c.name} (${c.type})${c.company ? ` — ${c.company}` : ""} — ${c.email ?? c.phone ?? "no contact info"}`);
  }
  lines.push("");
  lines.push(`## Contractors`);
  for (const link of contractors ?? []) {
    const c = (link as any).contractors;
    if (!c) continue;
    lines.push(
      `- ${c.company_name ?? c.contact_name ?? "Unknown"} — ${c.trade ?? "—"}${c.rating ? ` (${c.rating}★)` : ""}`
    );
  }
  lines.push(`- Building notes: ${building.notes ?? "None recorded."}`);

  const content = lines.join("\n");

  const { data: existing } = await supabase
    .from("knowledge_base_articles")
    .select("id")
    .eq("building_id", buildingId)
    .eq("is_handover_summary", true)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("knowledge_base_articles")
      .update({ content, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("knowledge_base_articles").insert({
      title: `Handover Summary — ${building.name}`,
      building_id: buildingId,
      category: "Handover",
      content,
      is_handover_summary: true,
      organization_id: user.organizationId,
      created_by: user.id,
      updated_by: user.id,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/knowledge-base");
  return { error: null };
}
