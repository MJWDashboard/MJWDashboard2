"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { enumLabel } from "@/lib/status";

type Deal = {
  id: string;
  prospect_name: string | null;
  shop_number: string | null;
  stage: string;
  deal_value: number | null;
  enquiry_date: string | null;
  enquiry_source: string | null;
  requirements: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  unit_size_sqm: number | null;
  rate_per_sqm: number | null;
  lease_term_months: number | null;
  commencement_date: string | null;
  notes: string | null;
  buildings: { name: string; address: string | null } | null;
  tenants: { trading_name: string } | null;
};

export function DealsheetButton({ deal }: { deal: Deal }) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 14;
      let y = 18;

      doc.setFontSize(18);
      doc.setTextColor(15, 20, 24);
      doc.text("Vorexa", marginX, y);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Leasing Dealsheet", pageWidth - marginX, y, { align: "right" });
      y += 8;

      doc.setDrawColor(200);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 8;

      doc.setFontSize(14);
      doc.setTextColor(15, 20, 24);
      doc.text(deal.buildings?.name ?? "Leasing Deal", marginX, y);
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(100);
      if (deal.buildings?.address) {
        doc.text(deal.buildings.address, marginX, y);
        y += 6;
      }
      y += 2;

      const rows: [string, string][] = [
        ["Tenant / Prospect", deal.tenants?.trading_name ?? deal.prospect_name ?? "—"],
        ["Shop Number", deal.shop_number ?? "—"],
        ["Stage", enumLabel(deal.stage)],
        ["Enquiry Date", deal.enquiry_date ? formatDate(deal.enquiry_date) : "—"],
        ["Enquiry Source", deal.enquiry_source ?? "—"],
        ["Contact", [deal.contact_email, deal.contact_phone].filter(Boolean).join(" / ") || "—"],
        ["Unit Size", deal.unit_size_sqm ? `${deal.unit_size_sqm} m²` : "—"],
        ["Rate / m²", deal.rate_per_sqm ? formatCurrency(deal.rate_per_sqm) : "—"],
        ["Lease Term", deal.lease_term_months ? `${deal.lease_term_months} months` : "—"],
        ["Commencement Date", deal.commencement_date ? formatDate(deal.commencement_date) : "—"],
        ["Deal Value", deal.deal_value ? formatCurrency(deal.deal_value) : "—"],
      ];

      (doc as any).autoTable({
        startY: y,
        body: rows,
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      if (deal.requirements) {
        doc.setFontSize(10);
        doc.setTextColor(15, 20, 24);
        doc.text("Requirements", marginX, y);
        y += 5;
        doc.setFontSize(9);
        doc.setTextColor(80);
        const wrapped = doc.splitTextToSize(deal.requirements, pageWidth - marginX * 2);
        doc.text(wrapped, marginX, y);
        y += wrapped.length * 4.5 + 6;
      }

      if (deal.notes) {
        doc.setFontSize(10);
        doc.setTextColor(15, 20, 24);
        doc.text("Notes", marginX, y);
        y += 5;
        doc.setFontSize(9);
        doc.setTextColor(80);
        const wrapped = doc.splitTextToSize(deal.notes, pageWidth - marginX * 2);
        doc.text(wrapped, marginX, y);
      }

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Generated ${formatDateTime(new Date().toISOString())}`, marginX, 290);

      doc.save(`dealsheet-${deal.buildings?.name ?? "deal"}-${deal.shop_number ?? deal.id}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleGenerate} disabled={loading} className="btn-secondary">
      <FileDown size={16} />
      {loading ? "Generating…" : "Dealsheet PDF"}
    </button>
  );
}
