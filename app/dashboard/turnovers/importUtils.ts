import { field, textValue, numberValue, booleanValue, type ImportPreviewRow } from "@/lib/imports";
import type { TurnoverImportData } from "./actions";

export type TurnoverMatchingBuilding = { id: string; building_code: string | null; name: string };
export type TurnoverMatchingTenant = {
  id: string;
  building_id: string;
  account_number: string | null;
  trading_name: string;
  shop_number: string | null;
  turnover_pct: number | null;
  turnover_penalty_clause: string | null;
  turnover_penalty_amount: number | null;
  monthly_turnover_required: boolean;
};
export type TurnoverMatchingTurnover = {
  id: string;
  tenant_id: string;
  period: string;
  turnover_amount: number | null;
  turnover_rental: number | null;
  submitted: boolean;
  submitted_at: string | null;
  penalty_applicable: boolean;
  penalty_amount: number | null;
  notes: string | null;
};

function dateValue(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = textValue(value);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function periodValue(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 7);
  const raw = textValue(value);
  const match = raw.match(/(\d{4})[-/]?(\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}` : "";
}

export function parseTurnoverImportRows(
  sheetRows: Record<string, unknown>[],
  buildings: TurnoverMatchingBuilding[],
  tenants: TurnoverMatchingTenant[],
  turnovers: TurnoverMatchingTurnover[]
): ImportPreviewRow<TurnoverImportData>[] {
  return sheetRows.map((source, index) => {
    const buildingCode = textValue(field(source, "Building Code")).toUpperCase();
    const accountNumber = textValue(field(source, "Tenant Account Number", "Account Number"));
    const period = periodValue(field(source, "Period"));
    const building = buildings.find((b) => b.building_code?.toUpperCase() === buildingCode);
    const tenant = building && tenants.find((t) => t.building_id === building.id && t.account_number?.trim() === accountNumber);
    const existing = tenant && turnovers.find((item) => item.tenant_id === tenant.id && item.period.slice(0, 7) === period);

    const errors: { field: string; value: string; reason: string }[] = [];
    const warnings: { field: string; value: string; reason: string }[] = [];
    if (!building) errors.push({ field: "Building Code", value: buildingCode, reason: "Building not found" });
    if (!accountNumber) errors.push({ field: "Tenant Account Number", value: accountNumber, reason: "Account number is required" });
    else if (building && !tenant) errors.push({ field: "Tenant Account Number", value: accountNumber, reason: "No tenant matched in this building" });
    if (!period) errors.push({ field: "Period", value: textValue(field(source, "Period")), reason: "Use YYYY-MM" });
    if (existing) warnings.push({ field: "Period", value: period, reason: `Existing turnover found (${existing.turnover_amount ?? "blank"}) and will be updated` });

    const suppliedPenalty = field(source, "Penalty Applicable");
    const data: TurnoverImportData = {
      buildingId: building?.id ?? "",
      tenantId: tenant?.id ?? "",
      buildingCode,
      accountNumber,
      tradingName: textValue(field(source, "Trading Name")) || tenant?.trading_name || "",
      shopNumber: textValue(field(source, "Shop Number")) || tenant?.shop_number || "",
      period,
      turnoverAmount: numberValue(field(source, "Turnover Amount (R)")),
      turnoverRental: numberValue(field(source, "Turnover Rental (R)")),
      submitted: booleanValue(field(source, "Submitted by Tenant")),
      submissionDate: dateValue(field(source, "Submission Date")),
      penaltyApplicable: suppliedPenalty === "" ? Boolean(tenant?.turnover_penalty_clause) : booleanValue(suppliedPenalty),
      penaltyAmount: numberValue(field(source, "Penalty Amount (R)")) ?? tenant?.turnover_penalty_amount ?? null,
      notes: textValue(field(source, "Notes")),
    };

    return {
      rowNumber: index + 2,
      action: errors.length ? "reject" : existing ? "update" : "create",
      matchKey: `${buildingCode} + ${accountNumber} + ${period}`,
      data,
      recordId: existing?.id,
      errors,
      warnings,
    } satisfies ImportPreviewRow<TurnoverImportData>;
  });
}

// A row is worth staging only if it's brand new, or if it actually differs from
// the currently committed turnover - otherwise every unchanged sheet row would
// re-stage itself as a no-op "update" on every sync run.
export function isMeaningfulChange(row: ImportPreviewRow<TurnoverImportData>, existing: TurnoverMatchingTurnover | undefined): boolean {
  if (row.errors.length) return false;
  if (!existing) return true;
  return (
    existing.turnover_amount !== row.data.turnoverAmount ||
    existing.turnover_rental !== row.data.turnoverRental ||
    existing.submitted !== row.data.submitted ||
    existing.penalty_applicable !== row.data.penaltyApplicable ||
    existing.penalty_amount !== row.data.penaltyAmount ||
    (existing.notes ?? "") !== (row.data.notes ?? "")
  );
}
