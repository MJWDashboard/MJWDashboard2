export type ParsedContactRow = {
  name: string;
  type: string;
  company: string;
  email: string;
  phone: string;
  officeNumber: string;
  buildingName: string;
};

export type CategorizedContactRow = ParsedContactRow & {
  category: "new" | "update" | "needs_review";
  buildingId: string | null;
  contactId: string | null;
  reason?: string;
};

const ALIASES: Record<keyof ParsedContactRow, string[]> = {
  name: ["name", "contact name", "full name"],
  type: ["type", "contact type", "role"],
  company: ["company", "organisation", "organization"],
  email: ["email", "email address"],
  phone: ["phone", "cellphone", "cell", "mobile"],
  officeNumber: ["office number", "office", "tel", "telephone"],
  buildingName: ["building", "building name", "property"],
};

function normalize(header: string): string {
  return header.trim().toLowerCase();
}

export function parseContactRows(sheetRows: Record<string, unknown>[]): ParsedContactRow[] {
  return sheetRows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalize(key)] = value;
    }
    function find(field: keyof ParsedContactRow): string {
      for (const alias of ALIASES[field]) {
        if (normalized[alias] !== undefined && normalized[alias] !== null) {
          return String(normalized[alias]).trim();
        }
      }
      return "";
    }
    return {
      name: find("name"),
      type: find("type"),
      company: find("company"),
      email: find("email"),
      phone: find("phone"),
      officeNumber: find("officeNumber"),
      buildingName: find("buildingName"),
    };
  });
}

const VALID_TYPES = new Set([
  "tenant", "tenant_owner", "tenant_manager", "landlord", "asset_manager",
  "property_manager", "leasing", "contractor", "electrician", "plumber",
  "fire", "security", "cleaning", "facilities", "emergency", "consultant",
  "attorney", "legal", "municipal", "internal", "other",
]);

export function categorizeContactRows(
  rows: ParsedContactRow[],
  buildings: { id: string; name: string }[],
  contacts: { id: string; building_id: string | null; name: string }[]
): CategorizedContactRow[] {
  return rows.map((row) => {
    if (!row.name) {
      return { ...row, category: "needs_review", buildingId: null, contactId: null, reason: "Missing name" };
    }

    let buildingId: string | null = null;
    if (row.buildingName) {
      const building = buildings.find((b) => b.name.toLowerCase() === row.buildingName.toLowerCase());
      if (!building) {
        return {
          ...row,
          category: "needs_review",
          buildingId: null,
          contactId: null,
          reason: `Building "${row.buildingName}" not found`,
        };
      }
      buildingId = building.id;
    }

    const existing = contacts.find(
      (c) => c.building_id === buildingId && c.name.toLowerCase() === row.name.toLowerCase()
    );

    const normalizedType = row.type.trim().toLowerCase().replace(/\s+/g, "_");
    const type = VALID_TYPES.has(normalizedType) ? normalizedType : "other";

    return {
      ...row,
      type,
      category: existing ? "update" : "new",
      buildingId,
      contactId: existing?.id ?? null,
    };
  });
}
