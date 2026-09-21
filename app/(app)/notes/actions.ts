"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function client() {
  return createClient();
}

export async function createNote(title: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("notes")
    .insert({ title: title || "Untitled", body: "" })
    .select()
    .single();
  revalidatePath("/notes");
  return { data, error: error?.message ?? null };
}

export async function updateNote(id: string, fields: { title?: string; body?: string }) {
  const supabase = await client();
  const { error } = await supabase
    .from("notes")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/notes");
  return { error: error?.message ?? null };
}

export async function togglePinNote(id: string, pinned: boolean) {
  const supabase = await client();
  await supabase.from("notes").update({ pinned }).eq("id", id);
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const supabase = await client();
  await supabase.from("notes").delete().eq("id", id);
  revalidatePath("/notes");
}

export async function createList(name: string, kind: string) {
  const supabase = await client();
  const { error } = await supabase.from("lists").insert({ name, kind });
  revalidatePath("/notes");
  return { error: error?.message ?? null };
}

export async function deleteList(id: string) {
  const supabase = await client();
  await supabase.from("lists").delete().eq("id", id);
  revalidatePath("/notes");
}

export async function addListItem(listId: string, name: string, quantity?: string) {
  const supabase = await client();
  const { count } = await supabase
    .from("list_items")
    .select("id", { count: "exact", head: true })
    .eq("list_id", listId);
  await supabase.from("list_items").insert({
    list_id: listId,
    name,
    quantity: quantity || null,
    position: count ?? 0,
  });
  revalidatePath("/notes");
}

export async function toggleListItem(id: string, checked: boolean) {
  const supabase = await client();
  await supabase.from("list_items").update({ checked }).eq("id", id);
  revalidatePath("/notes");
}

export async function deleteListItem(id: string) {
  const supabase = await client();
  await supabase.from("list_items").delete().eq("id", id);
  revalidatePath("/notes");
}
