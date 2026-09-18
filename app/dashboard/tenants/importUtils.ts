export type ParsedTenantRow = {
  buildingName: string;
  tradingName: string;
  shopNumber: string;
  gla: string;
  monthlyRental: string;
  leaseStart: string;
  leaseEnd: string;
  accountNumber: string;
  registeredEntity: string;
};

export type ImportCategory = "new" | "update" | "needs_review";

export type CategorizedRow = ParsedTenantRow & {
  category: ImportCategory;
  buildingId: string | null;
  tenantId: string | null;
  reason?: string;
};

const COLUMN_ALIASES: Record<keyof ParsedTenantRow, string[]> = {
  buildingName: ["building", "building name", "property"],
  tradingName: ["trading name", "tenant", "tenant name", "trading_name"],
  shopNumber: ["shop number", "shop", "unit", "shop_number"],
  gla: ["gla", "gla (m2)", "gla (m²)", "size"],
  monthlyRental: ["monthly rental", "rental", "rent", "monthly_rental"],
  leaseStart: ["lease start", "lease_start", "start date"],
  leaseEnd: ["lease end", "lease_end", "end date"],
  accountNumber: ["account number", "account_number", "account no", "acc no"],
  registeredEntity: ["registered entity", "entity", "registered_entity", "company name"],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

export function parseSheetRows(sheetRows: Record<string, unknown>[]): ParsedTenantRow[] {
  return sheetRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value;
    }

    function find(field: keyof ParsedTenantRow): string {
      for (const alias of COLUMN_ALIASES[field]) {
        if (normalized[alias] !== undefined && normalized[alias] !== null) {
          return String(normalized[alias]).trim();
        }
      }
      return "";
    }

    return {
      buildingName: find("buildingName"),
      tradingName: find("tradingName"),
      shopNumber: find("shopNumber"),
      gla: find("gla"),
      monthlyRental: find("monthlyRental"),
      leaseStart: find("leaseStart"),
      leaseEnd: find("leaseEnd"),
      accountNumber: find("accountNumber"),
      registeredEntity: find("registeredEntity"),
    };
  });
}

export function categorizeRows(
  rows: ParsedTenantRow[],
  buildings: { id: string; name: string }[],
  tenants: { id: string; building_id: string; trading_name: string }[]
): CategorizedRow[] {
  return rows.map((row) => {
    if (!row.tradingName) {
      return { ...row, category: "needs_review", buildingId: null, tenantId: null, reason: "Missing trading name" };
    }

    const building = buildings.find(
      (b) => b.name.toLowerCase() === row.buildingName.toLowerCase()
    );

    if (!building) {
      return {
        ...row,
        category: "needs_review",
        buildingId: null,
        tenantId: null,
        reason: `Building "${row.buildingName}" not found`,
      };
    }

    const existing = tenants.find(
      (t) =>
        t.building_id === building.id &&
        t.trading_name.toLowerCase() === row.tradingName.toLowerCase()
    );

    return {
      ...row,
      category: existing ? "update" : "new",
      buildingId: building.id,
      tenantId: existing?.id ?? null,
    };
  });
}
