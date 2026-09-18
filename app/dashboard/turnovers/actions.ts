"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/org";
import { computeMonthlyDueDate, computeAnnualDueDate, currentFinancialYear } from "@/lib/turnovers";

export type TurnoverInput = {
  tenant_id: string;
  building_id: string;
  unit: string;
  period: string;
  turnover_amount: string;
  turnover_rental: string;
  submitted: boolean;
  penalty_applicable: boolean;
  penalty_amount: string;
  penalty_status: string;
  notes: string;
};

function toNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildPayload(input: TurnoverInput) {
  return {
    tenant_id: input.tenant_id,
    building_id: input.building_id,
    unit: input.unit || null,
    period: input.period,
    due_date: computeMonthlyDueDate(input.period),
    turnover_amount: toNumeric(input.turnover_amount),
    turnover_rental: toNumeric(input.turnover_rental),
    submitted: input.submitted,
    submitted_at: input.submitted ? new Date().toISOString() : null,
    status: input.submitted ? "submitted" : "outstanding",
    penalty_applicable: input.penalty_applicable,
    penalty_amount: toNumeric(input.penalty_amount),
    penalty_status: input.penalty_status || null,
    notes: input.notes || null,
  };
}

export async function createTurnover(input: TurnoverInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase.from("turnovers").insert({
    ...buildPayload(input),
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnovers");
  return { error: null };
}

export async function updateTurnover(id: string, input: TurnoverInput) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("turnovers")
    .update({
      ...buildPayload(input),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnovers");
  return { error: null };
}

export async function markCertificateReceived(id: string, received: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const supabase = createClient();
  const { error } = await supabase
    .from("turnover_annual_certificates")
    .update({
      received_at: received ? new Date().toISOString().slice(0, 10) : null,
      status: received ? "received" : "outstanding",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/turnovers");
  return { error: null };
}

/**
 * Ensures every tenant with annual_turnover_required has a
 * turnover_annual_certificates row for the financial year that most
 * recently closed. Safe to call repeatedly - skips tenants that already
 * have a row for that year.
 */
export async function syncAnnualCertificates() {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized.", created: 0 };

  const supabase = createClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, building_id, financial_year_end_month, financial_year_end_day")
    .eq("annual_turnover_required", true)
    .is("archived_at", null)
    .not("financial_year_end_month", "is", null)
    .not("financial_year_end_day", "is", null);

  let created = 0;

  for (const t of tenants ?? []) {
    const fy = currentFinancialYear(t.financial_year_end_month!, t.financial_year_end_day!);
    const dueDate = computeAnnualDueDate(t.financial_year_end_month!, t.financial_year_end_day!, fy);

    const { error } = await supabase
      .from("turnover_annual_certificates")
      .insert({
        tenant_id: t.id,
        building_id: t.building_id,
        financial_year: fy,
        due_date: dueDate,
        created_by: user.id,
      })
      .select("id")
      .single();

    // Unique (tenant_id, financial_year) - a conflict just means it already exists.
    if (!error) created += 1;
  }

  revalidatePath("/dashboard/turnovers");
  return { error: null, created };
}
