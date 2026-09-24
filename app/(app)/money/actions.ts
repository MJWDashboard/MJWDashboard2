"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function createAccount(input: {
  name: string;
  kind: string;
  is_cash: boolean;
  opening_balance: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert(input);
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function updateAccount(id: string, fields: TablesUpdate<"accounts">) {
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update(fields).eq("id", id);
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  await supabase.from("accounts").delete().eq("id", id);
  revalidatePath("/money");
}

export async function createCategory(name: string, kind: "expense" | "income") {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").insert({ name, kind }).select().single();
  revalidatePath("/money");
  return { data, error: error?.message ?? null };
}

export async function createTransaction(input: {
  account_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  occurred_at: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert(input);
  revalidatePath("/money");
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function updateTransaction(id: string, fields: TablesUpdate<"transactions">) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").update(fields).eq("id", id);
  revalidatePath("/money");
  revalidatePath("/today");
  return { error: error?.message ?? null };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/money");
}

export async function upsertBudget(categoryId: string, month: string, plannedAmount: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .upsert({ category_id: categoryId, month, planned_amount: plannedAmount }, { onConflict: "owner_id,category_id,month" });
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function createDebt(input: {
  creditor: string;
  kind: string;
  balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  due_day: number | null;
  limit_amount: number | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("debts").insert(input);
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function updateDebt(id: string, fields: TablesUpdate<"debts">) {
  const supabase = await createClient();
  const { error } = await supabase.from("debts").update(fields).eq("id", id);
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function deleteDebt(id: string) {
  const supabase = await createClient();
  await supabase.from("debts").delete().eq("id", id);
  revalidatePath("/money");
}

export async function addDebtPayment(debtId: string, amount: number, paidAt: string) {
  const supabase = await createClient();
  const { data: debt } = await supabase.from("debts").select("balance").eq("id", debtId).single();
  await supabase.from("debt_payments").insert({ debt_id: debtId, amount, paid_at: paidAt });
  if (debt) {
    await supabase.from("debts").update({ balance: Math.max(0, Number(debt.balance) - amount) }).eq("id", debtId);
  }
  revalidatePath("/money");
}

// --- Categories -----------------------------------------------------------

export async function renameCategory(id: string, name: string) {
  const supabase = await createClient();
  await supabase.from("categories").update({ name }).eq("id", id);
  revalidatePath("/money");
}

export async function setCategoryHidden(id: string, hidden: boolean) {
  const supabase = await createClient();
  await supabase.from("categories").update({ hidden }).eq("id", id);
  revalidatePath("/money");
}

export async function setCategoryBudgetGroup(id: string, budgetGroup: "fixed" | "flexible" | "savings_debt") {
  const supabase = await createClient();
  await supabase.from("categories").update({ budget_group: budgetGroup }).eq("id", id);
  revalidatePath("/money");
}

export async function reorderCategories(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(orderedIds.map((id, position) => supabase.from("categories").update({ position }).eq("id", id)));
  revalidatePath("/money");
}

// --- Transaction review -----------------------------------------------------

/** Confirms a triaged/imported transaction's category and remembers the
 * merchant -> category pairing so future imports auto-categorise. */
export async function reviewTransaction(id: string, categoryId: string | null, merchant: string | null) {
  const supabase = await createClient();
  await supabase.from("transactions").update({ category_id: categoryId, reviewed: true }).eq("id", id);
  if (categoryId && merchant?.trim()) {
    await supabase
      .from("merchant_category_rules")
      .upsert({ merchant_pattern: merchant.trim().toLowerCase(), category_id: categoryId }, { onConflict: "owner_id,merchant_pattern" });
  }
  revalidatePath("/money");
}

export async function getMerchantCategoryRules() {
  const supabase = await createClient();
  const { data } = await supabase.from("merchant_category_rules").select("*");
  return data ?? [];
}

// --- Recurring expenses / subscriptions ------------------------------------

export async function createRecurringExpense(input: {
  provider: string;
  category_id: string | null;
  amount: number;
  frequency: string;
  next_due_date: string | null;
  payment_method: string | null;
  contract_end_date: string | null;
  cancellation_notice_days: number | null;
  notes: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_expenses").insert(input);
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function updateRecurringExpense(id: string, fields: TablesUpdate<"recurring_expenses">) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_expenses").update(fields).eq("id", id);
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function deleteRecurringExpense(id: string) {
  const supabase = await createClient();
  await supabase.from("recurring_expenses").delete().eq("id", id);
  revalidatePath("/money");
}

export async function markRecurringReviewed(id: string) {
  const supabase = await createClient();
  await supabase.from("recurring_expenses").update({ last_reviewed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/money");
}

// --- Savings goals ----------------------------------------------------------

export async function createSavingsGoal(input: {
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  monthly_contribution: number | null;
  linked_account_id: string | null;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").insert(input);
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function updateSavingsGoal(id: string, fields: TablesUpdate<"savings_goals">) {
  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").update(fields).eq("id", id);
  revalidatePath("/money");
  return { error: error?.message ?? null };
}

export async function deleteSavingsGoal(id: string) {
  const supabase = await createClient();
  await supabase.from("savings_goals").delete().eq("id", id);
  revalidatePath("/money");
}

// --- Net worth ---------------------------------------------------------------

export async function saveNetWorthSnapshot(month: string, totalAssets: number, totalLiabilities: number) {
  const supabase = await createClient();
  await supabase
    .from("net_worth_snapshots")
    .upsert(
      { snapshot_month: month, total_assets: totalAssets, total_liabilities: totalLiabilities, net_worth: totalAssets - totalLiabilities },
      { onConflict: "owner_id,snapshot_month" }
    );
  revalidatePath("/money");
}

// --- Import templates ---------------------------------------------------------

export async function saveImportTemplate(name: string, columnMapping: Record<string, string>, delimiter: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_templates")
    .insert({ name, column_mapping: columnMapping, delimiter })
    .select()
    .single();
  revalidatePath("/money");
  return { data, error: error?.message ?? null };
}

export async function deleteImportTemplate(id: string) {
  const supabase = await createClient();
  await supabase.from("import_templates").delete().eq("id", id);
  revalidatePath("/money");
}

/** CSV import v2 — takes already-mapped rows, skips duplicates (same
 * account/date/amount/description already on file), inserts the rest as
 * reviewed=false so they surface in the Needs Review queue. */
export async function importTransactionRows(
  accountId: string,
  rows: { occurred_at: string; description: string; amount: number; merchant: string | null }[]
) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("transactions")
    .select("occurred_at, description, amount")
    .eq("account_id", accountId);

  const existingKeys = new Set((existing ?? []).map((t) => `${t.occurred_at}|${t.description}|${t.amount}`));
  const fresh = rows.filter((r) => !existingKeys.has(`${r.occurred_at}|${r.description}|${r.amount}`));
  const duplicates = rows.length - fresh.length;

  if (fresh.length > 0) {
    const rules = await getMerchantCategoryRules();
    const { error } = await supabase.from("transactions").insert(
      fresh.map((r) => {
        const rule = r.merchant ? rules.find((rule) => r.merchant!.toLowerCase().includes(rule.merchant_pattern)) : null;
        return {
          account_id: accountId,
          description: r.description,
          amount: r.amount,
          occurred_at: r.occurred_at,
          merchant: r.merchant,
          category_id: rule?.category_id ?? null,
          reviewed: Boolean(rule),
        };
      })
    );
    if (error) return { error: error.message, imported: 0, duplicates };
  }

  revalidatePath("/money");
  return { error: null, imported: fresh.length, duplicates };
}
