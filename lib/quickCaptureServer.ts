"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CapturePayload = Record<string, unknown>;

/** Files a capture straight into its real table the moment it's saved —
 * note, weight and shopping item need no extra input to do this. Fuel and
 * expense need a relational field (which vehicle, which account) the quick
 * sheet deliberately doesn't ask for, so those are left pending for the
 * Today inbox to triage with one tap. */
export async function autoFileCapture(id: string, type: string, payload: CapturePayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (type === "note") {
    const text = String(payload.text ?? "").trim();
    if (!text) return;
    await supabase.from("notes").insert({ title: text.slice(0, 60), body: text, category: "note" });
    revalidatePath("/notes");
  } else if (type === "weight") {
    const kg = Number(payload.kg);
    if (!kg) return;
    await supabase.from("health_metrics").insert({ metric: "weight", value: kg, unit: "kg" });
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
