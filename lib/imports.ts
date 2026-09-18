export type ImportIssue = { field: string; value: string; reason: string };

export type ImportPreviewRow<T> = {
  rowNumber: number;
  action: "create" | "update" | "reject" | "skip";
  matchKey: string;
  data: T;
  recordId?: string | null;
  errors: ImportIssue[];
  warnings: ImportIssue[];
};

export function textValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value).trim();
}

export function numberValue(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).replace(/[R,\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function booleanValue(value: unknown): boolean {
  return ["true", "yes", "y", "1", "active"].includes(textValue(value).toLowerCase());
}

export function normalizedRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]));
}

export function field(row: Record<string, unknown>, ...headers: string[]) {
  const normalized = normalizedRow(row);
  for (const header of headers) {
    const value = normalized[header.toLowerCase()];
    if (value !== undefined && value !== null) return value;
  }
  return "";
}

export function downloadErrorWorkbook(moduleName: string, rows: ImportPreviewRow<unknown>[]) {
  import("xlsx").then((XLSX) => {
    const errors = rows.flatMap((row) =>
      [...row.errors, ...row.warnings].map((issue) => ({
        "Row Number": row.rowNumber,
        "Offending Field": issue.field,
        "Supplied Value": issue.value,
        "Reason": issue.reason,
        Severity: row.errors.includes(issue) ? "Error" : "Warning",
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(errors), "Import Errors");
    XLSX.writeFile(workbook, `${moduleName}-import-errors.xlsx`);
  });
}
