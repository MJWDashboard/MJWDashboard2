"use client";

import { Download } from "lucide-react";

export function ExportButton({
  filename,
  sheetName,
  rows,
}: {
  filename: string;
  sheetName: string;
  rows: Record<string, unknown>[];
}) {
  async function handleExport() {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  return (
    <button onClick={handleExport} className="btn-secondary" disabled={rows.length === 0}>
      <Download size={16} />
      Export
    </button>
  );
}
