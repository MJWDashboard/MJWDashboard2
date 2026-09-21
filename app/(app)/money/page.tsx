import { createClient } from "@/lib/supabase/server";
import { MoneyClient } from "./MoneyClient";

export const metadata = { title: "Money" };

export default async function MoneyPage() {
  const supabase = await createClient();

  const [
    { data: accounts },
    { data: transactions },
    { data: categories },
    { data: budgets },
    { data: debts },
    { data: entities },
  ] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at", { ascending: true }),
    supabase.from("transactions").select("*").order("occurred_at", { ascending: false }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase.from("budgets").select("*"),
    supabase.from("debts").select("*").order("created_at", { ascending: true }),
    supabase.from("entities").select("*"),
  ]);

  return (
    <MoneyClient
      accounts={accounts ?? []}
      transactions={transactions ?? []}
      categories={categories ?? []}
      budgets={budgets ?? []}
      debts={debts ?? []}
      entities={entities ?? []}
    />
  );
}
