"use client";

import { FileDown } from "lucide-react";

export function PdfExportButton({
  filename,
  title,
  subtitle,
  columns,
  rows,
}: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  async function handleExport() {
    const { default: jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 18);

    if (subtitle) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(subtitle, 14, 25);
    }

    (doc as any).autoTable({
      head: [columns],
      body: rows,
      startY: subtitle ? 30 : 24,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 20, 24] },
    });

    doc.save(`${filename}.pdf`);
  }

  return (
    <button onClick={handleExport} className="btn-secondary" disabled={rows.length === 0}>
      <FileDown size={16} />
      PDF
    </button>
  );
}
