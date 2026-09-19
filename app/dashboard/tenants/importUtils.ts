import { field, textValue, numberValue, booleanValue, type ImportIssue, type ImportPreviewRow } from "@/lib/imports";

// Matches public.tenant_lifecycle_status exactly - see lib/status.ts for display labels.
const VALID_STATUSES = new Set(["pending", "active", "vacating", "expired", "inactive"]);

function mapStatus(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (VALID_STATUSES.has(v)) return v;
  if (["terminated", "vacated", "ex-tenant", "ex tenant", "closed"].includes(v)) return "inactive";
  if (["vacating", "notice given", "notice"].includes(v)) return "vacating";
  if (["pending", "signed - not occupied", "not yet occupied"].includes(v)) return "pending";
  // "Occupied", blank, or anything unrecognized defaults to active - the overwhelming
  // majority of rows on a real tenancy schedule are current, in-occupation tenants.
  return "active";
}

export type TenantImportData = {
  buildingId: string;
  buildingCode: string;
  tradingName: string;
  registeredEntity: string;
  accountNumber: string;
  shopNumber: string;
  gla: string;
  status: string;
  leaseStart: string;
  leaseEnd: string;
  optionPeriod: string;
  monthlyRental: string;
  escalationPct: string;
  escalationDate: string;
  operatingCosts: string;
  rates: string;
  marketingCharge: string;
  otherCharges: string;
  depositAmount: string;
  depositType: string;
  bankGuaranteeReference: string;
  suretyName: string;
  suretyExpiry: string;
  ficaStatus: string;
  insuranceStatus: string;
  leaseSigned: boolean;
  depositReceived: boolean;
  guaranteeReceived: boolean;
  suretyReceived: boolean;
  turnoverReportingRequired: boolean;
  monthlyTurnoverRequired: boolean;
  annualTurnoverRequired: boolean;
  turnoverPct: string;
  financialYearEndMonth: string;
  financialYearEndDay: string;
  turnoverPenaltyClause: string;
  turnoverPenaltyAmount: string;
  notes: string;
};

type RawTenantRow = Omit<TenantImportData, "buildingId"> & { rowNumber: number };

function parseRawRow(source: Record<string, unknown>, rowNumber: number): RawTenantRow {
  return {
    rowNumber,
    buildingCode: textValue(field(source, "Building Code")).toUpperCase(),
    tradingName: textValue(field(source, "Trading Name")),
    registeredEntity: textValue(field(source, "Registered Entity")),
    accountNumber: textValue(field(source, "Account Number")),
    shopNumber: textValue(field(source, "Shop Number")),
    gla: textValue(field(source, "GLA (m²)", "GLA (m2)")),
    status: mapStatus(textValue(field(source, "Status"))),
    leaseStart: textValue(field(source, "Lease Start")),
    leaseEnd: textValue(field(source, "Lease End")),
    optionPeriod: textValue(field(source, "Option Period")),
    monthlyRental: textValue(field(source, "Monthly Rental (R)")),
    escalationPct: textValue(field(source, "Escalation %")),
    escalationDate: textValue(field(source, "Escalation Date")),
    operatingCosts: textValue(field(source, "Operating Costs (R)")),
    rates: textValue(field(source, "Rates (R)")),
    marketingCharge: textValue(field(source, "Marketing (R)")),
    otherCharges: textValue(field(source, "Other Charges (R)")),
    depositAmount: textValue(field(source, "Deposit Amount (R)")),
    depositType: textValue(field(source, "Deposit Type")),
    bankGuaranteeReference: textValue(field(source, "Bank Guarantee Reference")),
    suretyName: textValue(field(source, "Surety Name")),
    suretyExpiry: textValue(field(source, "Surety Expiry")),
    ficaStatus: textValue(field(source, "FICA Status")),
    insuranceStatus: textValue(field(source, "Insurance Status")),
    leaseSigned: booleanValue(field(source, "Lease Signed")),
    depositReceived: booleanValue(field(source, "Deposit Received")),
    guaranteeReceived: booleanValue(field(source, "Guarantee Received")),
    suretyReceived: booleanValue(field(source, "Surety Received")),
    turnoverReportingRequired: booleanValue(field(source, "Turnover Reporting Required")),
    monthlyTurnoverRequired: booleanValue(field(source, "Monthly Turnover Required")),
    annualTurnoverRequired: booleanValue(field(source, "Annual Certificate Required")),
    turnoverPct: textValue(field(source, "Turnover %")),
    financialYearEndMonth: textValue(field(source, "FYE Month")),
    financialYearEndDay: textValue(field(source, "FYE Day")),
    turnoverPenaltyClause: textValue(field(source, "Penalty Clause")),
    turnoverPenaltyAmount: textValue(field(source, "Penalty Amount (R)")),
    notes: textValue(field(source, "Notes")),
  };
}

function firstNonEmpty(values: string[]): string {
  return values.find((v) => v !== "") ?? "";
}

function firstTrue(values: boolean[]): boolean {
  return values.some(Boolean);
}

function sumNumeric(values: string[]): string {
  const nums = values.map(numberValue).filter((n): n is number => n !== null);
  if (!nums.length) return "";
  return String(Math.round(nums.reduce((a, b) => a + b, 0) * 100) / 100);
}

// A single tenant can occupy several physical units, each listed as its own row on
// the source tenancy schedule (same account, different shop/rental). The schema
// only allows one active tenant per (building, account number), so rows sharing a
// match key are combined into a single tenant here rather than left to collide
// against that constraint at commit time.
function mergeGroup(rows: RawTenantRow[]): RawTenantRow {
  if (rows.length === 1) return rows[0];
  const primary = rows[0];
  const shopNumbers = [...new Set(rows.map((r) => r.shopNumber).filter(Boolean))];
  return {
    ...primary,
    shopNumber: shopNumbers.join(", "),
    gla: sumNumeric(rows.map((r) => r.gla)),
    monthlyRental: sumNumeric(rows.map((r) => r.monthlyRental)),
    operatingCosts: sumNumeric(rows.map((r) => r.operatingCosts)),
    rates: sumNumeric(rows.map((r) => r.rates)),
    marketingCharge: sumNumeric(rows.map((r) => r.marketingCharge)),
    otherCharges: sumNumeric(rows.map((r) => r.otherCharges)),
    depositAmount: sumNumeric(rows.map((r) => r.depositAmount)),
    leaseSigned: firstTrue(rows.map((r) => r.leaseSigned)),
    depositReceived: firstTrue(rows.map((r) => r.depositReceived)),
    guaranteeReceived: firstTrue(rows.map((r) => r.guaranteeReceived)),
    suretyReceived: firstTrue(rows.map((r) => r.suretyReceived)),
    turnoverReportingRequired: firstTrue(rows.map((r) => r.turnoverReportingRequired)),
    monthlyTurnoverRequired: firstTrue(rows.map((r) => r.monthlyTurnoverRequired)),
    annualTurnoverRequired: firstTrue(rows.map((r) => r.annualTurnoverRequired)),
    notes: firstNonEmpty(rows.map((r) => r.notes)),
  };
}

function groupKey(row: RawTenantRow): string {
  return row.accountNumber
    ? `${row.buildingCode}::acct::${row.accountNumber.toUpperCase()}`
    : `${row.buildingCode}::shop::${row.shopNumber.toUpperCase()}::${row.tradingName.toLowerCase()}`;
}

export function parseTenantImportRows(
  sheetRows: Record<string, unknown>[],
  buildings: { id: string; building_code: string | null }[],
  existingTenants: { id: string; building_id: string; account_number: string | null; shop_number: string | null; trading_name: string }[]
): ImportPreviewRow<TenantImportData>[] {
  const parsed = sheetRows
    .map((source, index) => parseRawRow(source, index + 2))
    .filter((row) => row.buildingCode || row.tradingName);

  const groups = new Map<string, RawTenantRow[]>();
  for (const row of parsed) {
    const key = groupKey(row);
    const existing = groups.get(key);
    if (existing) existing.push(row);
    else groups.set(key, [row]);
  }

  const buildingByCode = new Map(buildings.filter((b) => b.building_code).map((b) => [b.building_code!.toUpperCase(), b.id]));

  return [...groups.values()].map((group) => {
    const merged = mergeGroup(group);
    const buildingId = buildingByCode.get(merged.buildingCode) ?? "";
    const errors: ImportIssue[] = [];
    const warnings: ImportIssue[] = [];

    if (!merged.buildingCode) {
      errors.push({ field: "Building Code", value: "", reason: "Building Code is required" });
    } else if (!buildingId) {
      errors.push({ field: "Building Code", value: merged.buildingCode, reason: "Building Code not found or not accessible" });
    }
    if (!merged.tradingName) {
      errors.push({ field: "Trading Name", value: "", reason: "Trading Name is required" });
    }
    if (!merged.accountNumber && !merged.shopNumber) {
      warnings.push({ field: "Account Number", value: "", reason: "No Account Number or Shop Number supplied - matching against future uploads may be unreliable" });
    }
    if (merged.leaseStart && merged.leaseEnd && merged.leaseEnd < merged.leaseStart) {
      errors.push({ field: "Lease End", value: merged.leaseEnd, reason: "Lease End cannot precede Lease Start" });
    }

    const existing = buildingId
      ? existingTenants.find((t) => {
          if (t.building_id !== buildingId) return false;
          if (merged.accountNumber) return (t.account_number ?? "").toUpperCase() === merged.accountNumber.toUpperCase();
          return (
            (t.shop_number ?? "").toUpperCase() === merged.shopNumber.toUpperCase() &&
            t.trading_name.toLowerCase() === merged.tradingName.toLowerCase()
          );
        })
      : undefined;

    const data: TenantImportData = { ...merged, buildingId };
    return {
      rowNumber: group[0].rowNumber,
      action: errors.length ? "reject" : existing ? "update" : "create",
      matchKey: `${merged.buildingCode} + ${merged.accountNumber || merged.shopNumber || merged.tradingName}`,
      data,
      recordId: existing?.id,
      errors,
      warnings,
    };
  });
}
