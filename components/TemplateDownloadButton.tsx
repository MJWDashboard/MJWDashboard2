"use client";

import { Download } from "lucide-react";

export function TemplateDownloadButton({ filename, sheetName, headers }: { filename: string; sheetName: string; headers: string[] }) {
  async function download() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([headers]);
    sheet["!cols"] = headers.map((header) => ({ wch: Math.max(14, header.length + 2) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    XLSX.writeFile(workbook, filename);
  }

  return <button className="btn-secondary" onClick={download}><Download size={16} />Download Template</button>;
}
