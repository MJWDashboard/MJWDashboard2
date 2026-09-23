"use server";

import { createClient } from "@/lib/supabase/server";

/** Every owner-scoped table whose data a person might reasonably want a
 * copy of. Deliberately excludes `google_accounts` (holds live OAuth
 * access/refresh tokens — never exported) and `audit_log` (an internal
 * access log, not content the owner created). RLS already restricts every
 * query below to the signed-in owner's own rows. */
const EXPORT_TABLES = [
  "profiles", "entities", "tags", "reminders", "attachments", "events",
  "important_dates", "quick_captures",
  "tasks", "task_focus_sessions", "daily_reviews", "weekly_reviews", "monthly_reviews",
  "accounts", "transactions", "categories", "budgets", "debts", "debt_payments",
  "recurring_expenses", "savings_goals", "net_worth_snapshots", "import_templates", "merchant_category_rules",
  "habits", "habit_logs", "wellness_entries", "sleep_entries",
  "health_metrics", "medicines", "med_doses", "appointments",
  "goals", "goal_milestones",
  "life_admin_items", "home_maintenance", "home_contacts",
  "travel_trips", "travel_items",
  "notes", "lists", "list_items",
  "vehicles", "services", "fuel_logs", "trips",
  "pets", "pet_care_items", "pet_visits", "assets",
  "documents", "policies", "credentials", "matters",
  "support_tickets", "assistant_queries",
] as const;

export type ExportResult = { json: string; error: string | null };

/** Bundles every one of the owner's own records into a single JSON
 * document — the "own your data, always" guarantee, and the closest thing
 * this session can build to Phase 6's broader import/export item without
 * standing up new infrastructure. Runs read-only queries only. */
export async function exportMyData(): Promise<ExportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { json: "", error: "Not signed in." };

  const results = await Promise.all(
    EXPORT_TABLES.map(async (table) => {
      const { data, error } = await supabase.from(table).select("*");
      return [table, error ? [] : (data ?? [])] as const;
    })
  );

  const bundle = {
    exported_at: new Date().toISOString(),
    account_email: user.email,
    data: Object.fromEntries(results),
  };

  return { json: JSON.stringify(bundle, null, 2), error: null };
}
