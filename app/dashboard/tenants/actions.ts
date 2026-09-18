"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";

export type TenantInput = {
  building_id: string;
  trading_name: string;
  shop_number: string;
  gla: string;
  monthly_rental: string;
  lease_start: string;
  lease_end: string;
  status: string;
  notes: string;
};

function toNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function toDate(value: string): string | null {
  return value.trim() ? value : null;
}

export async function createTenant(input: TenantInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("tenants").insert({
    building_id: input.building_id,
    trading_name: input.trading_name,
    shop_number: input.shop_number || null,
    gla: toNumeric(input.gla),
    monthly_rental: toNumeric(input.monthly_rental),
    lease_start: toDate(input.lease_start),
    lease_end: toDate(input.lease_end),
    status: input.status as any,
    notes: input.notes || null,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateTenant(id: string, input: TenantInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      building_id: input.building_id,
      trading_name: input.trading_name,
      shop_number: input.shop_number || null,
      gla: toNumeric(input.gla),
      monthly_rental: toNumeric(input.monthly_rental),
      lease_start: toDate(input.lease_start),
      lease_end: toDate(input.lease_end),
      status: input.status as any,
      notes: input.notes || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/tenants");
  revalidatePath(`/dashboard/tenants/${id}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function getExistingTenantsForImport() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id, building_id, trading_name")
    .is("archived_at", null);

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export type ImportRow = {
  category: "new" | "update";
  buildingId: string;
  tenantId: string | null;
  tradingName: string;
  shopNumber: string;
  gla: string;
  monthlyRental: string;
  leaseStart: string;
  leaseEnd: string;
};

export async function commitTenantImport(rows: ImportRow[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", imported: 0 };

  const supabase = createClient();
  let imported = 0;

  for (const row of rows) {
    const payload = {
      building_id: row.buildingId,
      trading_name: row.tradingName,
      shop_number: row.shopNumber || null,
      gla: toNumeric(row.gla),
      monthly_rental: toNumeric(row.monthlyRental),
      lease_start: toDate(row.leaseStart),
      lease_end: toDate(row.leaseEnd),
      import_source: "excel_import",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (row.category === "update" && row.tenantId) {
      const { error } = await supabase.from("tenants").update(payload).eq("id", row.tenantId);
      if (!error) imported += 1;
    } else {
      const { error } = await supabase
        .from("tenants")
        .insert({ ...payload, created_by: user.id });
      if (!error) imported += 1;
    }
  }

  revalidatePath("/dashboard/tenants");
  revalidatePath("/dashboard");
  return { error: null, imported };
}
