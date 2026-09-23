import { createClient } from "@/lib/supabase/server";
import { currentMonth } from "@/lib/money";
import { MoneyClient } from "./MoneyClient";

export const metadata = { title: "Money" };

export default async function MoneyPage() {
  const supabase = await createClient();
  const month = currentMonth();

  const [
    { data: accounts },
    { data: transactions },
    { data: categories },
    { data: budgets },
    { data: debts },
    { data: debtPayments },
    { data: entities },
    { data: recurringExpenses },
    { data: savingsGoals },
    { data: netWorthSnapshots },
    { data: importTemplates },
  ] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at", { ascending: true }),
    supabase.from("transactions").select("*").order("occurred_at", { ascending: false }),
    supabase.from("categories").select("*").order("position", { ascending: true }),
    supabase.from("budgets").select("*").eq("month", month),
    supabase.from("debts").select("*").order("created_at", { ascending: true }),
    supabase.from("debt_payments").select("*").order("paid_at", { ascending: false }),
    supabase.from("entities").select("*"),
    supabase.from("recurring_expenses").select("*").order("next_due_date", { ascending: true }),
    supabase.from("savings_goals").select("*").order("created_at", { ascending: true }),
    supabase.from("net_worth_snapshots").select("*").order("snapshot_month", { ascending: false }).limit(12),
    supabase.from("import_templates").select("*"),
  ]);

  return (
    <MoneyClient
      accounts={accounts ?? []}
      transactions={transactions ?? []}
      categories={categories ?? []}
      budgets={budgets ?? []}
      debts={debts ?? []}
      debtPayments={debtPayments ?? []}
      entities={entities ?? []}
      recurringExpenses={recurringExpenses ?? []}
      savingsGoals={savingsGoals ?? []}
      netWorthSnapshots={netWorthSnapshots ?? []}
      importTemplates={importTemplates ?? []}
      month={month}
    />
  );
}
