import { createClient } from "@/lib/supabase/server";
import { VaultClient } from "./VaultClient";

export const metadata = { title: "Vault" };

export default async function VaultPage() {
  const supabase = await createClient();

  const [{ data: documents }, { data: policies }, { data: credentials }, { data: matters }, { data: files }] =
    await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("policies").select("*").order("created_at", { ascending: false }),
      supabase.from("credentials").select("*").order("service", { ascending: true }),
      supabase.from("matters").select("*").order("status", { ascending: true }).order("due_date", { ascending: true }),
      supabase.from("attachments").select("*").eq("record_table", "documents"),
    ]);

  return (
    <VaultClient
      documents={documents ?? []}
      policies={policies ?? []}
      credentials={credentials ?? []}
      matters={matters ?? []}
      files={files ?? []}
    />
  );
}
