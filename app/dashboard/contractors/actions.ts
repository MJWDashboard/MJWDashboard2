"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type ContractorInput = {
  company_name: string;
  contact_name: string;
  trade: string;
  email: string;
  phone: string;
  alt_phone: string;
  vat_number: string;
  registration_number: string;
  rating: string;
  standard_rate: string;
  notes: string;
  building_ids: string[];
};

function toNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

// Used by manual create/edit: the checked set fully replaces the assignment.
async function replaceBuildings(
  supabase: ReturnType<typeof createClient>,
  contractorId: string,
  buildingIds: string[]
) {
  await supabase.from("contractor_buildings").delete().eq("contractor_id", contractorId);
  if (buildingIds.length === 0) return;
  await supabase
    .from("contractor_buildings")
    .insert(buildingIds.map((building_id) => ({ contractor_id: contractorId, building_id })));
}

// Used by Excel import: buildings already on file are never dropped, only added to.
async function addBuildings(
  supabase: ReturnType<typeof createClient>,
  contractorId: string,
  buildingIds: string[]
) {
  if (buildingIds.length === 0) return;
  await supabase
    .from("contractor_buildings")
    .upsert(
      buildingIds.map((building_id) => ({ contractor_id: contractorId, building_id })),
      { onConflict: "contractor_id,building_id", ignoreDuplicates: true }
    );
}

export async function createContractor(input: ContractorInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("contractors")
    .insert({
      company_name: input.company_name || null,
      contact_name: input.contact_name || null,
      trade: input.trade || null,
      email: input.email || null,
      phone: input.phone || null,
      alt_phone: input.alt_phone || null,
      vat_number: input.vat_number || null,
      registration_number: input.registration_number || null,
      rating: toNumeric(input.rating),
      standard_rate: toNumeric(input.standard_rate),
      notes: input.notes || null,
      organization_id: user.organizationId,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  await replaceBuildings(supabase, data.id, input.building_ids);
  revalidatePath("/dashboard/contractors");
  return { error: null };
}

export async function updateContractor(id: string, input: ContractorInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("contractors")
    .update({
      company_name: input.company_name || null,
      contact_name: input.contact_name || null,
      trade: input.trade || null,
      email: input.email || null,
      phone: input.phone || null,
      alt_phone: input.alt_phone || null,
      vat_number: input.vat_number || null,
      registration_number: input.registration_number || null,
      rating: toNumeric(input.rating),
      standard_rate: toNumeric(input.standard_rate),
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  await replaceBuildings(supabase, id, input.building_ids);
  revalidatePath("/dashboard/contractors");
  return { error: null };
}

export async function getExistingContractorsForImport() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contractors")
    .select("id, company_name, contact_name, trade, registration_number")
    .is("archived_at", null);

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export type ContractorImportRow = {
  category: "new" | "update";
  contractorId: string | null;
  companyName: string;
  contactName: string;
  trade: string;
  email: string;
  phone: string;
  altPhone: string;
  vatNumber: string;
  registrationNumber: string;
  rating: string;
  standardRate: string;
  notes: string;
  buildingIds: string[];
};

export async function commitContractorImport(rows: ContractorImportRow[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", imported: 0 };

  const supabase = createClient();
  let imported = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    if (row.category === "update" && row.contractorId) {
      const { data: existing } = await supabase
        .from("contractors")
        .select(
          "company_name, contact_name, trade, email, phone, alt_phone, vat_number, registration_number, rating, standard_rate, notes"
        )
        .eq("id", row.contractorId)
        .maybeSingle();

      // Coalesce merge: an imported value only ever fills in, never blanks
      // out data that is already recorded against this contractor.
      const merged = {
        company_name: row.companyName || existing?.company_name || null,
        contact_name: row.contactName || existing?.contact_name || null,
        trade: row.trade || existing?.trade || null,
        email: row.email || existing?.email || null,
        phone: row.phone || existing?.phone || null,
        alt_phone: row.altPhone || existing?.alt_phone || null,
        vat_number: row.vatNumber || existing?.vat_number || null,
        registration_number: row.registrationNumber || existing?.registration_number || null,
        rating: toNumeric(row.rating) ?? existing?.rating ?? null,
        standard_rate: toNumeric(row.standardRate) ?? existing?.standard_rate ?? null,
        notes: row.notes || existing?.notes || null,
        import_source: "excel",
        last_imported_at: now,
        updated_by: user.id,
        updated_at: now,
      };

      const { error } = await supabase.from("contractors").update(merged).eq("id", row.contractorId);
      if (!error) {
        imported += 1;
        await addBuildings(supabase, row.contractorId, row.buildingIds);
      }
    } else {
      const { data, error } = await supabase
        .from("contractors")
        .insert({
          company_name: row.companyName || null,
          contact_name: row.contactName || null,
          trade: row.trade || null,
          email: row.email || null,
          phone: row.phone || null,
          alt_phone: row.altPhone || null,
          vat_number: row.vatNumber || null,
          registration_number: row.registrationNumber || null,
          rating: toNumeric(row.rating),
          standard_rate: toNumeric(row.standardRate),
          notes: row.notes || null,
          import_source: "excel",
          last_imported_at: now,
          organization_id: user.organizationId,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("id")
        .single();
      if (!error && data) {
        imported += 1;
        await addBuildings(supabase, data.id, row.buildingIds);
      }
    }
  }

  revalidatePath("/dashboard/contractors");
  return { error: null, imported };
}
