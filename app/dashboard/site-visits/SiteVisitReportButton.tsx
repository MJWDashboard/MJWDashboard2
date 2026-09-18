"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";
import { getSignedPhotoUrls } from "./actions";

type Photo = { id: string; file_path: string; caption: string | null };
type Item = {
  id: string;
  category: string;
  location: string | null;
  description: string;
  risk_level: string;
  priority: string;
  target_date: string | null;
  status: string;
  notes: string | null;
  tenants: { trading_name: string } | null;
  contractors: { contacts: { name: string } | null } | null;
  site_visit_photos: Photo[];
};

type Visit = {
  id: string;
  visit_date: string;
  start_time: string | null;
  visit_type: string | null;
  attendees: string | null;
  weather: string | null;
  observations: string | null;
  status: string;
  buildings: { name: string; address: string | null } | null;
};

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function SiteVisitReportButton({ visit, items }: { visit: Visit; items: Item[] }) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const allPaths = items.flatMap((i) => i.site_visit_photos.map((p) => p.file_path));
      const signedUrls = allPaths.length > 0 ? await getSignedPhotoUrls(allPaths) : {};

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 14;
      let y = 18;

      doc.setFontSize(18);
      doc.setTextColor(15, 20, 24);
      doc.text("Vorexa", marginX, y);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Site Visit Report", pageWidth - marginX, y, { align: "right" });
      y += 8;

      doc.setDrawColor(200);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 8;

      doc.setFontSize(14);
      doc.setTextColor(15, 20, 24);
      doc.text(visit.buildings?.name ?? "Site Visit", marginX, y);
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(100);
      const meta = [
        visit.buildings?.address,
        `Date: ${formatDate(visit.visit_date)}${visit.start_time ? ` ${visit.start_time}` : ""}`,
        visit.visit_type ? `Type: ${visit.visit_type}` : null,
        visit.attendees ? `Attendees: ${visit.attendees}` : null,
        visit.weather ? `Weather: ${visit.weather}` : null,
      ].filter(Boolean);
      for (const line of meta) {
        doc.text(String(line), marginX, y);
        y += 5;
      }
      y += 3;

      if (visit.observations) {
        doc.setFontSize(10);
        doc.setTextColor(15, 20, 24);
        doc.text("General Notes", marginX, y);
        y += 5;
        doc.setFontSize(9);
        doc.setTextColor(80);
        const wrapped = doc.splitTextToSize(visit.observations, pageWidth - marginX * 2);
        doc.text(wrapped, marginX, y);
        y += wrapped.length * 4.5 + 4;
      }

      (doc as any).autoTable({
        startY: y,
        head: [["Category", "Location", "Description", "Risk", "Priority", "Status", "Target"]],
        body: items.map((i) => [
          i.category,
          i.location ?? "—",
          i.description,
          i.risk_level,
          i.priority,
          i.status,
          i.target_date ? formatDate(i.target_date) : "—",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [15, 20, 24] },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      for (const item of items) {
        if (item.site_visit_photos.length === 0) continue;

        if (y > 250) {
          doc.addPage();
          y = 18;
        }

        doc.setFontSize(10);
        doc.setTextColor(15, 20, 24);
        doc.text(`${item.category}${item.location ? ` - ${item.location}` : ""}`, marginX, y);
        y += 6;

        let x = marginX;
        const imgSize = 40;
        for (const photo of item.site_visit_photos) {
          const url = signedUrls[photo.file_path];
          const dataUrl = url ? await loadImageAsDataUrl(url) : null;
          if (!dataUrl) continue;

          if (x + imgSize > pageWidth - marginX) {
            x = marginX;
            y += imgSize + 4;
          }
          if (y + imgSize > 280) {
            doc.addPage();
            y = 18;
            x = marginX;
          }

          try {
            doc.addImage(dataUrl, "JPEG", x, y, imgSize, imgSize);
          } catch {
            // Skip images the browser couldn't decode into the canvas.
          }
          x += imgSize + 4;
        }
        y += imgSize + 10;
      }

      const pageCount = doc.internal.pages.length - 1;
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated ${formatDateTime(new Date().toISOString())} · Page ${p} of ${pageCount}`,
          marginX,
          290
        );
      }

      doc.save(`site-visit-${visit.buildings?.name ?? "report"}-${visit.visit_date}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleGenerate} disabled={loading} className="btn-primary">
      <FileDown size={16} />
      {loading ? "Generating…" : "Generate Report"}
    </button>
  );
}
