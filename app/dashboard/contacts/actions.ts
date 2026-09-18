"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { createImportBatch, finalizeImportBatch } from "@/lib/import-batches";
import type { ImportPreviewRow } from "@/lib/imports";

export type ContactInput = {
  name: string;
  type: string;
  company: string;
  email: string;
  phone: string;
  office_number: string;
  emergency_number: string;
  after_hours_number: string;
  building_id: string;
  active: boolean;
  notes: string;
};

function buildPayload(input: ContactInput) {
  return {
    name: input.name,
    type: input.type as any,
    company: input.company || null,
    email: input.email || null,
    phone: input.phone || null,
    office_number: input.office_number || null,
    emergency_number: input.emergency_number || null,
    after_hours_number: input.after_hours_number || null,
    building_id: input.building_id || null,
    active: input.active,
    notes: input.notes || null,
  };
}

export async function createContact(input: ContactInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("contacts").insert({
    ...buildPayload(input),
    organization_id: user.organizationId,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/contacts");
  return { error: null };
}

export async function updateContact(id: string, input: ContactInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      ...buildPayload(input),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/contacts");
  return { error: null };
}

export async function getExistingContactsForImport() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, building_id, name")
    .is("archived_at", null);

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export type ContactImportRow = {
  category: "new" | "update";
  contactId: string | null;
  buildingId: string | null;
  name: string;
  type: string;
  company: string;
  email: string;
  phone: string;
  officeNumber: string;
};

export async function commitContactImport(rows: ContactImportRow[], filename: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", imported: 0 };

  const supabase = createClient();
  let imported = 0;
  let created = 0;
  let updated = 0;

  const previewRows: ImportPreviewRow<ContactImportRow>[] = rows.map((row, i) => ({
    rowNumber: i + 1,
    action: row.category === "update" ? "update" : "create",
    matchKey: `${row.name} @ ${row.buildingId ?? "org"}`,
    data: row,
    recordId: row.contactId,
    errors: [],
    warnings: [],
  }));
  const batchResult = await createImportBatch({
    module: "contacts",
    filename,
    templateVersion: "VOREXA-CONTACTS-v1",
    portfolioId: null,
    rows: previewRows,
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 1;
    const payload = {
      name: row.name,
      type: row.type as any,
      company: row.company || null,
      email: row.email || null,
      phone: row.phone || null,
      office_number: row.officeNumber || null,
      building_id: row.buildingId,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    let recordId: string | null | undefined = row.contactId;
    let previous: any = null;
    let rowError: string | null = null;

    if (row.category === "update" && row.contactId) {
      const before = await supabase.from("contacts").select("*").eq("id", row.contactId).single();
      previous = before.data;
      const { error } = await supabase.from("contacts").update(payload).eq("id", row.contactId);
      rowError = error?.message ?? null;
      if (!rowError) {
        imported += 1;
        updated += 1;
      }
    } else {
      const { data, error } = await supabase
        .from("contacts")
        .insert({ ...payload, organization_id: user.organizationId, created_by: user.id })
        .select("id")
        .single();
      rowError = error?.message ?? null;
      recordId = data?.id;
      if (!rowError) {
        imported += 1;
        created += 1;
      }
    }

    if (batchResult.batchId) {
      await supabase
        .from("import_batch_rows")
        .update({
          status: rowError ? "rejected" : "applied",
          record_table: "contacts",
          record_id: recordId || null,
          previous_data: previous,
          applied_data: rowError ? null : payload,
          errors: rowError ? [{ field: "row", value: row.name, reason: rowError }] : [],
        })
        .eq("batch_id", batchResult.batchId)
        .eq("row_number", rowNumber);
      if (!rowError && recordId) {
        await supabase.from("audit_log").insert({
          table_name: "contacts",
          record_id: recordId,
          action: row.category === "update" ? "import_update" : "import_create",
          field_changes: { previous, applied: payload },
          import_source: filename,
          import_batch_id: batchResult.batchId,
          performed_by: user.id,
        });
      }
    }
  }

  if (batchResult.batchId) {
    await finalizeImportBatch(batchResult.batchId, created, updated);
  }

  revalidatePath("/dashboard/contacts");
  return { error: null, imported, batchId: batchResult.batchId };
}
