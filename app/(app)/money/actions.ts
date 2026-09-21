"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/money");
}

export async function bulkImportTransactions(
  accountId: string,
  rows: { occurred_at: string; description: string; amount: number }[]
) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert(
    rows.map((r) => ({ ...r, account_id: accountId }))
  );
  revalidatePath("/money");
  return { error: error?.message ?? null, count: rows.length };
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
