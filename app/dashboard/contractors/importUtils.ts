export type ParsedContractorRow = {
  companyName: string;
  contactName: string;
  trade: string;
  email: string;
  phone: string;
  altPhone: string;
  vatNumber: string;
  registrationNumber: string;
  buildingNames: string;
  rating: string;
  standardRate: string;
  notes: string;
};

export type CategorizedContractorRow = ParsedContractorRow & {
  category: "new" | "update" | "needs_review";
  contractorId: string | null;
  buildingIds: string[];
  unmatchedBuildingNames: string[];
  reason?: string;
};

const ALIASES: Record<keyof ParsedContractorRow, string[]> = {
  companyName: ["company name", "company", "business name"],
  contactName: ["contact name", "contact", "name"],
  trade: ["trade", "service", "category"],
  email: ["email", "email address"],
  phone: ["phone", "cell", "cellphone", "mobile"],
  altPhone: ["alt phone", "alternate phone", "office number", "tel", "telephone"],
  vatNumber: ["vat number", "vat", "vat no"],
  registrationNumber: ["registration number", "reg number", "reg no", "account number"],
  buildingNames: ["buildings", "building", "building name", "properties"],
  rating: ["rating"],
  standardRate: ["standard rate", "rate", "day rate", "call out rate"],
  notes: ["notes", "comments"],
};

function normalize(header: string): string {
  return header.trim().toLowerCase();
}

export function parseContractorRows(sheetRows: Record<string, unknown>[]): ParsedContractorRow[] {
  return sheetRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalize(key)] = value;
    }
    function find(field: keyof ParsedContractorRow): string {
      for (const alias of ALIASES[field]) {
        if (normalized[alias] !== undefined && normalized[alias] !== null) {
          return String(normalized[alias]).trim();
        }
      }
      return "";
    }
    return {
      companyName: find("companyName"),
      contactName: find("contactName"),
      trade: find("trade"),
      email: find("email"),
      phone: find("phone"),
      altPhone: find("altPhone"),
      vatNumber: find("vatNumber"),
      registrationNumber: find("registrationNumber"),
      buildingNames: find("buildingNames"),
      rating: find("rating"),
      standardRate: find("standardRate"),
      notes: find("notes"),
    };
  });
}

function matchKey(companyName: string, contactName: string, trade: string): string {
  const identity = (companyName || contactName).trim().toLowerCase();
  return `${identity}|${trade.trim().toLowerCase()}`;
}

export function categorizeContractorRows(
  rows: ParsedContractorRow[],
  buildings: { id: string; name: string }[],
  existing: {
    id: string;
    company_name: string | null;
    contact_name: string | null;
    trade: string | null;
    registration_number: string | null;
  }[]
): CategorizedContractorRow[] {
  return rows.map((row) => {
    if (!row.companyName && !row.contactName) {
      return {
        ...row,
        category: "needs_review",
        contractorId: null,
        buildingIds: [],
        unmatchedBuildingNames: [],
        reason: "Missing company name and contact name",
      };
    }

    let match =
      row.registrationNumber &&
      existing.find(
        (c) => (c.registration_number ?? "").trim().toLowerCase() === row.registrationNumber.toLowerCase()
      );

    if (!match) {
      const key = matchKey(row.companyName, row.contactName, row.trade);
      match = existing.find(
        (c) => matchKey(c.company_name ?? "", c.contact_name ?? "", c.trade ?? "") === key
      );
    }

    const buildingIds: string[] = [];
    const unmatchedBuildingNames: string[] = [];
    for (const name of row.buildingNames.split(/[,;]/).map((n) => n.trim()).filter(Boolean)) {
      const building = buildings.find((b) => b.name.toLowerCase() === name.toLowerCase());
      if (building) buildingIds.push(building.id);
      else unmatchedBuildingNames.push(name);
    }

    return {
      ...row,
      category: match ? "update" : "new",
      contractorId: match?.id ?? null,
      buildingIds,
      unmatchedBuildingNames,
    };
  });
}
