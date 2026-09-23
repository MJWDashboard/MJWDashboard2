"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  href: string;
};

/** Cross-module search — the "search Santam, get everything" experience.
 * Runs a small ILIKE query per table in parallel rather than standing up
 * full-text search infra; fine at this data scale. */
export async function searchEverything(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = await createClient();
  const like = `%${q}%`;

  const [tasks, notes, listItems, events, importantDates, vehicles, pets, documents, policies, debts, accounts] = await Promise.all([
    supabase.from("tasks").select("id, title, due_date").ilike("title", like).limit(6),
    supabase.from("notes").select("id, title, body").ilike("title", like).limit(6),
    supabase.from("list_items").select("id, name, list_id").ilike("name", like).limit(6),
    supabase.from("events").select("id, title, starts_at").ilike("title", like).limit(6),
    supabase.from("important_dates").select("id, title").ilike("title", like).limit(4),
    supabase.from("vehicles").select("id, make, model").or(`make.ilike.${like},model.ilike.${like}`).limit(4),
    supabase.from("pets").select("id, name, breed").ilike("name", like).limit(4),
    supabase.from("documents").select("id, doc_type, issuer").or(`doc_type.ilike.${like},issuer.ilike.${like}`).limit(6),
    supabase.from("policies").select("id, insurer, kind").ilike("insurer", like).limit(6),
    supabase.from("debts").select("id, creditor").ilike("creditor", like).limit(4),
    supabase.from("accounts").select("id, name").ilike("name", like).limit(4),
  ]);

  const results: SearchResult[] = [];

  for (const t of tasks.data ?? [])
    results.push({ id: t.id, title: t.title, subtitle: t.due_date ? `Due ${t.due_date}` : "Task", category: "Plan", href: "/plan" });
  for (const n of notes.data ?? [])
    results.push({ id: n.id, title: n.title, subtitle: (n.body ?? "").slice(0, 60), category: "Notes", href: "/notes" });
  for (const li of listItems.data ?? [])
    results.push({ id: li.id, title: li.name, subtitle: "Shopping / list item", category: "Notes", href: "/notes" });
  for (const e of events.data ?? [])
    results.push({ id: e.id, title: e.title, subtitle: new Date(e.starts_at).toLocaleDateString("en-ZA"), category: "Calendar", href: "/calendar" });
  for (const d of importantDates.data ?? [])
    results.push({ id: d.id, title: d.title, subtitle: "Important date", category: "Calendar", href: "/calendar" });
  for (const v of vehicles.data ?? [])
    results.push({ id: v.id, title: `${v.make} ${v.model}`, subtitle: "Vehicle", category: "Vehicle & Travel", href: "/vehicle" });
  for (const p of pets.data ?? [])
    results.push({ id: p.id, title: p.name, subtitle: p.breed ?? "Pet", category: "Home & Pets", href: "/pets" });
  for (const doc of documents.data ?? [])
    results.push({ id: doc.id, title: doc.doc_type, subtitle: doc.issuer ?? "Document", category: "Vault", href: "/vault" });
  for (const pol of policies.data ?? [])
    results.push({ id: pol.id, title: pol.insurer, subtitle: `${pol.kind} policy`, category: "Vault", href: "/vault" });
  for (const d of debts.data ?? [])
    results.push({ id: d.id, title: d.creditor, subtitle: "Debt", category: "Money", href: "/money" });
  for (const a of accounts.data ?? [])
    results.push({ id: a.id, title: a.name, subtitle: "Account", category: "Money", href: "/money" });

  return results;
}
