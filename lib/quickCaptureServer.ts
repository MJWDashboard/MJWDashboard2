"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CapturePayload = Record<string, unknown>;

/** Files a capture straight into its real table the moment it's saved —
 * note, weight, shopping item, task, appointment, reminder and general
 * (falls back to a note) need no extra input to do this. Fuel, expense and
 * debt payment need a relational field (which vehicle/account/debt) the
 * quick sheet deliberately doesn't ask for, so those are left pending for
 * the Today inbox to triage with one tap. */
export async function autoFileCapture(id: string, type: string, payload: CapturePayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (type === "note" || type === "general") {
    const text = String(payload.text ?? payload.title ?? "").trim();
    if (!text) return;
    await supabase.from("notes").insert({ title: text.slice(0, 60), body: text, category: "note" });
    revalidatePath("/notes");
  } else if (type === "weight") {
    const kg = Number(payload.kg);
    if (!kg) return;
    await supabase.from("health_metrics").insert({ metric: "weight", value: kg, unit: "kg" });
    revalidatePath("/health");
  } else if (type === "mood") {
    const mood = Number(payload.mood);
    if (!mood || mood < 1 || mood > 5) return;
    await supabase
      .from("wellness_entries")
      .upsert({ entry_date: new Date().toISOString().slice(0, 10), mood }, { onConflict: "owner_id,entry_date" });
    revalidatePath("/health");
  } else if (type === "shopping_item") {
    const item = String(payload.item ?? "").trim();
    if (!item) return;
    let listId: string | null = null;
    const { data: existingList } = await supabase.from("lists").select("id").eq("kind", "shopping").limit(1).maybeSingle();
    if (existingList) {
      listId = existingList.id;
    } else {
      const { data: createdList } = await supabase.from("lists").insert({ name: "Shopping", kind: "shopping" }).select("id").single();
      listId = createdList?.id ?? null;
    }
    if (!listId) return;
    const { count } = await supabase.from("list_items").select("id", { count: "exact", head: true }).eq("list_id", listId);
    await supabase.from("list_items").insert({ list_id: listId, name: item, position: count ?? 0 });
    revalidatePath("/notes");
  } else if (type === "task") {
    const title = String(payload.title ?? "").trim();
    if (!title) return;
    await supabase.from("tasks").insert({
      title,
      priority: (payload.priority as string) ?? "normal",
      status: payload.due_date ? "planned" : "inbox",
      due_date: (payload.due_date as string) ?? null,
      due_time: (payload.due_time as string) ?? null,
      task_date: (payload.due_date as string) ?? new Date().toISOString().slice(0, 10),
      recurrence_rule: (payload.recurrence as string) ?? "none",
      tier: "important",
    });
    revalidatePath("/plan");
  } else if (type === "appointment") {
    const title = String(payload.title ?? "").trim();
    const date = payload.due_date as string | undefined;
    if (!title || !date) return;
    const time = (payload.due_time as string) ?? "09:00";
    await supabase.from("events").insert({
      title,
      starts_at: new Date(`${date}T${time}:00`).toISOString(),
      module: "general",
      source: "app",
    });
    revalidatePath("/calendar");
  } else if (type === "reminder") {
    const title = String(payload.title ?? "").trim();
    if (!title) return;
    const date = payload.due_date as string | undefined;
    await supabase.from("reminders").insert({
      module: "today",
      title,
      due_at: date ? new Date(`${date}T${(payload.due_time as string) ?? "09:00"}:00`).toISOString() : null,
      severity: "ok",
    });
    revalidatePath("/plan");
  } else {
    return;
  }

  await supabase.from("quick_captures").update({ processed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/today");
}

export async function getPendingCaptures() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quick_captures")
    .select("*")
    .is("processed_at", null)
    .order("captured_at", { ascending: true });
  return data ?? [];
}

export async function dismissCapture(id: string) {
  const supabase = await createClient();
  await supabase.from("quick_captures").update({ processed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/today");
}

export async function triageFuelCapture(
  id: string,
  input: { vehicle_id: string; litres: number; odometer: number; full_tank: boolean }
) {
  const supabase = await createClient();
  const { data: capture } = await supabase.from("quick_captures").select("payload, captured_at").eq("id", id).single();
  if (!capture) return { error: "Capture not found" };

  const payload = capture.payload as { total?: number; note?: string };
  const total = Number(payload.total ?? 0);

  const { error } = await supabase.from("fuel_logs").insert({
    vehicle_id: input.vehicle_id,
    occurred_at: capture.captured_at,
    litres: input.litres,
    price_per_litre: input.litres ? total / input.litres : null,
    total,
    odometer: input.odometer,
    full_tank: input.full_tank,
    station: payload.note ? String(payload.note) : null,
  });
  if (error) return { error: error.message };

  await supabase.from("vehicles").update({ odometer: input.odometer }).eq("id", input.vehicle_id);
  await supabase.from("quick_captures").update({ processed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/today");
  revalidatePath("/vehicle");
  return { error: null };
}

export async function triageExpenseCapture(id: string, input: { account_id: string; category_id: string | null }) {
  const supabase = await createClient();
  const { data: capture } = await supabase.from("quick_captures").select("payload, captured_at").eq("id", id).single();
  if (!capture) return { error: "Capture not found" };

  const payload = capture.payload as { amount?: number; note?: string };

  const { error } = await supabase.from("transactions").insert({
    account_id: input.account_id,
    category_id: input.category_id,
    description: payload.note ? String(payload.note) : "Quick capture",
    amount: -Math.abs(Number(payload.amount ?? 0)),
    occurred_at: capture.captured_at,
  });
  if (error) return { error: error.message };

  await supabase.from("quick_captures").update({ processed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/today");
  revalidatePath("/money");
  return { error: null };
}

export async function triageDebtPaymentCapture(id: string, input: { debt_id: string }) {
  const supabase = await createClient();
  const { data: capture } = await supabase.from("quick_captures").select("payload, captured_at").eq("id", id).single();
  if (!capture) return { error: "Capture not found" };

  const payload = capture.payload as { amount?: number };
  const amount = Number(payload.amount ?? 0);

  const { error } = await supabase.from("debt_payments").insert({
    debt_id: input.debt_id,
    amount,
    paid_at: capture.captured_at.slice(0, 10),
  });
  if (error) return { error: error.message };

  const { data: debt } = await supabase.from("debts").select("balance").eq("id", input.debt_id).single();
  if (debt) {
    await supabase.from("debts").update({ balance: Math.max(0, Number(debt.balance) - amount) }).eq("id", input.debt_id);
  }

  await supabase.from("quick_captures").update({ processed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/today");
  revalidatePath("/money");
  return { error: null };
}
