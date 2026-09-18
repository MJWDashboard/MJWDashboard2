export type ParsedArrearsRow = {
  buildingName: string;
  debtorName: string;
  accountNumber: string;
  currentBalance: string;
  days30: string;
  days60: string;
  days90Plus: string;
};

export type CategorizedArrearsRow = ParsedArrearsRow & {
  buildingId: string | null;
  existingId: string | null;
  tenantId: string | null;
  matchStatus: "matched" | "possible" | "unmatched";
  needsReview: boolean;
  reason?: string;
};

const ALIASES: Record<keyof ParsedArrearsRow, string[]> = {
  buildingName: ["building", "building name", "property"],
  debtorName: ["debtor", "debtor name", "tenant", "tenant name", "trading name"],
  accountNumber: ["account number", "account_number", "account no", "acc no"],
  currentBalance: ["current balance", "balance", "total outstanding", "current"],
  days30: ["30 days", "30 day", "days 30", "30d"],
  days60: ["60 days", "60 day", "days 60", "60d"],
  days90Plus: ["90 days", "90+", "90 day", "days 90", "120+", "90d"],
};

function normalize(header: string): string {
  return header.trim().toLowerCase();
}

export function parseArrearsRows(sheetRows: Record<string, unknown>[]): ParsedArrearsRow[] {
  return sheetRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalize(key)] = value;
    }
    function find(field: keyof ParsedArrearsRow): string {
      for (const alias of ALIASES[field]) {
        if (normalized[alias] !== undefined && normalized[alias] !== null) {
          return String(normalized[alias]).trim();
        }
      }
      return "";
    }
    return {
      buildingName: find("buildingName"),
      debtorName: find("debtorName"),
      accountNumber: find("accountNumber"),
      currentBalance: find("currentBalance"),
      days30: find("days30"),
      days60: find("days60"),
      days90Plus: find("days90Plus"),
    };
  });
}

export function categorizeArrearsRows(
  rows: ParsedArrearsRow[],
  buildings: { id: string; name: string }[],
  existingCurrent: { id: string; building_id: string; tenant_id: string | null; debtor_name: string | null; account_number: string | null }[],
  tenants: { id: string; building_id: string; trading_name: string; account_number: string | null }[]
): CategorizedArrearsRow[] {
  return rows.map((row) => {
    if (!row.debtorName) {
      return {
        ...row,
        buildingId: null,
        existingId: null,
        tenantId: null,
        matchStatus: "unmatched",
        needsReview: true,
        reason: "Missing debtor name",
      };
    }

    const building = buildings.find((b) => b.name.toLowerCase() === row.buildingName.toLowerCase());
    if (!building) {
      return {
        ...row,
        buildingId: null,
        existingId: null,
        tenantId: null,
        matchStatus: "unmatched",
        needsReview: true,
        reason: `Building "${row.buildingName}" not found`,
      };
    }

    // Reconcile against last import's arrears_current row for this debtor,
    // by account number first (stable) then by name within the building.
    const existing =
      (row.accountNumber &&
        existingCurrent.find((r) => r.building_id === building.id && r.account_number === row.accountNumber)) ||
      existingCurrent.find(
        (r) => r.building_id === building.id && (r.debtor_name ?? "").toLowerCase() === row.debtorName.toLowerCase()
      ) ||
      null;

    // Try to match this debtor to a Tenant Master record.
    const buildingTenants = tenants.filter((t) => t.building_id === building.id);
    const exactTenant =
      (row.accountNumber && buildingTenants.find((t) => t.account_number === row.accountNumber)) ||
      buildingTenants.find((t) => t.trading_name.toLowerCase() === row.debtorName.toLowerCase());

    if (exactTenant) {
      return {
        ...row,
        buildingId: building.id,
        existingId: existing?.id ?? null,
        tenantId: exactTenant.id,
        matchStatus: "matched",
        needsReview: false,
      };
    }

    const possibleTenant = buildingTenants.find(
      (t) =>
        t.trading_name.toLowerCase().includes(row.debtorName.toLowerCase()) ||
        row.debtorName.toLowerCase().includes(t.trading_name.toLowerCase())
    );

    return {
      ...row,
      buildingId: building.id,
      existingId: existing?.id ?? null,
      tenantId: possibleTenant?.id ?? null,
      matchStatus: possibleTenant ? "possible" : "unmatched",
      needsReview: false,
    };
  });
}
