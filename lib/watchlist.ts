import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";

export type WatchSeverity = "soon" | "overdue";

export type WatchlistItem = {
  id: string;
  title: string;
  due_at: string | null;
  amount_at_risk: number | null;
  severity: WatchSeverity;
  href: string;
};

const SOON_WINDOW_DAYS = 30;
const LOW_STOCK_THRESHOLD = 7;
const DEBT_DUE_WINDOW_DAYS = 5;

function daysUntilDate(dateStr: string, today: Date) {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function severityForDays(days: number): WatchSeverity | null {
  if (days < 0) return "overdue";
  if (days <= SOON_WINDOW_DAYS) return "soon";
  return null;
}

function nextMonthlyOccurrence(day: number, today: Date) {
  let candidate = new Date(today.getFullYear(), today.getMonth(), day);
  if (candidate < today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
  return candidate;
}

/** Derives "what needs you" live from every module's own dates and stock
 * levels — Vehicle service/licence, Vault policy/document expiry, Health
 * script expiry and low stock, Money debt due dates. Nothing writes this to
 * a table, so it's always current and can never drift out of sync. */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const supabase = await createClient();
  const today = toZonedTime(new Date(), SAST);
  today.setHours(0, 0, 0, 0);

  const [
    { data: vehicles },
    { data: services },
    { data: policies },
    { data: documents },
    { data: medicines },
    { data: debts },
    { data: matters },
    { data: appointments },
  ] = await Promise.all([
    supabase.from("vehicles").select("id, make, model, licence_disc_expiry"),
    supabase.from("services").select("id, work_done, next_due_date"),
    supabase.from("policies").select("id, insurer, kind, renewal_date, premium"),
    supabase.from("documents").select("id, doc_type, issuer, expiry_date"),
    supabase.from("medicines").select("id, name, active, stock_on_hand, script_expiry"),
    supabase.from("debts").select("id, creditor, balance, due_day, minimum_payment, status"),
    supabase.from("matters").select("id, matter, due_date, status"),
    supabase.from("appointments").select("id, provider, follow_up_date, completed"),
  ]);

  const items: WatchlistItem[] = [];

  for (const v of vehicles ?? []) {
    if (!v.licence_disc_expiry) continue;
    const severity = severityForDays(daysUntilDate(v.licence_disc_expiry, today));
    if (severity) {
      items.push({
        id: `vehicle-disc-${v.id}`,
        title: `${v.make} ${v.model} — licence disc`,
        due_at: v.licence_disc_expiry,
        amount_at_risk: null,
        severity,
        href: "/vehicle",
      });
    }
  }

  for (const s of services ?? []) {
    if (!s.next_due_date) continue;
    const severity = severityForDays(daysUntilDate(s.next_due_date, today));
    if (severity) {
      items.push({
        id: `service-${s.id}`,
        title: s.work_done ? `Service due — ${s.work_done}` : "Service due",
        due_at: s.next_due_date,
        amount_at_risk: null,
        severity,
        href: "/vehicle",
      });
    }
  }

  for (const p of policies ?? []) {
    if (!p.renewal_date) continue;
    const severity = severityForDays(daysUntilDate(p.renewal_date, today));
    if (severity) {
      items.push({
        id: `policy-${p.id}`,
        title: `${p.insurer} ${p.kind} renewal`,
        due_at: p.renewal_date,
        amount_at_risk: p.premium,
        severity,
        href: "/vault",
      });
    }
  }

  for (const d of documents ?? []) {
    if (!d.expiry_date) continue;
    const severity = severityForDays(daysUntilDate(d.expiry_date, today));
    if (severity) {
      items.push({
        id: `document-${d.id}`,
        title: `${d.doc_type}${d.issuer ? ` — ${d.issuer}` : ""} expiring`,
        due_at: d.expiry_date,
        amount_at_risk: null,
        severity,
        href: "/vault",
      });
    }
  }

  for (const m of medicines ?? []) {
    if (!m.active) continue;
    if (m.stock_on_hand === 0) {
      items.push({
        id: `med-stock-${m.id}`,
        title: `${m.name} — out of stock`,
        due_at: null,
        amount_at_risk: null,
        severity: "overdue",
        href: "/health",
      });
    } else if (m.stock_on_hand <= LOW_STOCK_THRESHOLD) {
      items.push({
        id: `med-stock-${m.id}`,
        title: `${m.name} — running low (${m.stock_on_hand} left)`,
        due_at: null,
        amount_at_risk: null,
        severity: "soon",
        href: "/health",
      });
    }
    if (m.script_expiry) {
      const severity = severityForDays(daysUntilDate(m.script_expiry, today));
      if (severity) {
        items.push({
          id: `med-script-${m.id}`,
          title: `${m.name} — script expiring`,
          due_at: m.script_expiry,
          amount_at_risk: null,
          severity,
          href: "/health",
        });
      }
    }
  }

  for (const d of debts ?? []) {
    if (d.status !== "active" || !d.due_day) continue;
    const nextDue = nextMonthlyOccurrence(d.due_day, today);
    const days = Math.round((nextDue.getTime() - today.getTime()) / 86400000);
    if (days >= 0 && days <= DEBT_DUE_WINDOW_DAYS) {
      items.push({
        id: `debt-${d.id}`,
        title: `${d.creditor} payment due`,
        due_at: nextDue.toISOString(),
        amount_at_risk: d.minimum_payment ?? d.balance,
        severity: "soon",
        href: "/money",
      });
    }
  }

  for (const m of matters ?? []) {
    if (m.status !== "open" || !m.due_date) continue;
    const severity = severityForDays(daysUntilDate(m.due_date, today));
    if (severity) {
      items.push({
        id: `matter-${m.id}`,
        title: `${m.matter} — action due`,
        due_at: m.due_date,
        amount_at_risk: null,
        severity,
        href: "/vault",
      });
    }
  }

  for (const a of appointments ?? []) {
    if (a.completed || !a.follow_up_date) continue;
    const severity = severityForDays(daysUntilDate(a.follow_up_date, today));
    if (severity) {
      items.push({
        id: `appointment-followup-${a.id}`,
        title: `Follow up with ${a.provider}`,
        due_at: a.follow_up_date,
        amount_at_risk: null,
        severity,
        href: "/health",
      });
    }
  }

  const severityRank: Record<WatchSeverity, number> = { overdue: 0, soon: 1 };
  items.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity] || (a.due_at ?? "").localeCompare(b.due_at ?? "")
  );
  return items.slice(0, 10);
}
