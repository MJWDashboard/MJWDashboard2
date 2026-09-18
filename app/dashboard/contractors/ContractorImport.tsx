"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/StatusBadge";
import {
  parseContractorRows,
  categorizeContractorRows,
  type CategorizedContractorRow,
} from "./importUtils";
import { getExistingContractorsForImport, commitContractorImport } from "./actions";

export function ContractorImportButton({ buildings }: { buildings: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CategorizedContractorRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const router = useRouter();

  function reset() {
    setRows(null);
    setFileName(null);
    setError(null);
    setDone(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
      const parsed = parseContractorRows(sheetRows);
      const { data: existing } = await getExistingContractorsForImport();
      setRows(categorizeContractorRows(parsed, buildings, existing));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!rows) return;
    setLoading(true);
    const importable = rows.filter((r) => r.category !== "needs_review");
    const result = await commitContractorImport(
      importable.map((r) => ({
        category: r.category as "new" | "update",
        contractorId: r.contractorId,
        companyName: r.companyName,
        contactName: r.contactName,
        trade: r.trade,
        email: r.email,
        phone: r.phone,
        altPhone: r.altPhone,
        vatNumber: r.vatNumber,
        registrationNumber: r.registrationNumber,
        rating: r.rating,
        standardRate: r.standardRate,
        notes: r.notes,
        buildingIds: r.buildingIds,
      })),
      fileName ?? "contractors-import.xlsx"
    );
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(result.imported);
    router.refresh();
  }

  const counts = rows
    ? {
        new: rows.filter((r) => r.category === "new").length,
        update: rows.filter((r) => r.category === "update").length,
        needs_review: rows.filter((r) => r.category === "needs_review").length,
      }
    : null;

  return (
    <>
      <button
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="btn-secondary"
      >
        <Upload size={16} />
        Import
      </button>
      {open && (
        <Modal title="Import Contractors" onClose={() => setOpen(false)}>
          {!rows && (
            <div>
              <p className="mb-4 text-sm text-charcoal-300">
                Upload a .xlsx or .csv with Company Name, Contact Name, Trade,
                Email, Phone, Alt Phone, VAT Number, Registration Number,
                Buildings (comma-separated), Rating, Standard Rate and Notes.
                Rows are matched by registration number, or by company/contact
                name + trade. Matches are merged - existing information is
                never deleted or blanked out by an import, and buildings
                already on file are kept even if the sheet omits them.
              </p>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="input" />
              {loading && <p className="mt-3 text-sm text-charcoal-400">Reading file…</p>}
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            </div>
          )}

          {rows && counts && done === null && (
            <div>
              <div className="mb-4 flex gap-3 text-sm">
                <Badge label={`${counts.new} new`} className="bg-green-500/20 text-green-400" />
                <Badge label={`${counts.update} merge`} className="bg-cyan-600/20 text-cyan-400" />
                <Badge label={`${counts.needs_review} needs review`} className="bg-yellow-500/20 text-yellow-400" />
              </div>
              <div className="max-h-72 overflow-y-auto rounded-md border border-charcoal-700">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Company / Contact</th>
                      <th>Trade</th>
                      <th>Buildings</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.companyName || r.contactName || "—"}</td>
                        <td>{r.trade || "—"}</td>
                        <td>
                          {r.buildingIds.length} matched
                          {r.unmatchedBuildingNames.length > 0 && (
                            <span className="ml-1 text-yellow-400">
                              , {r.unmatchedBuildingNames.length} unknown
                            </span>
                          )}
                        </td>
                        <td>
                          {r.category === "needs_review" ? (
                            <span className="text-xs text-yellow-400">{r.reason}</span>
                          ) : (
                            <span className="text-xs capitalize text-charcoal-300">
                              {r.category === "update" ? "merge" : r.category}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              <div className="mt-4 flex justify-end gap-3">
                <button className="btn-secondary" onClick={reset}>
                  Choose Different File
                </button>
                <button
                  className="btn-primary"
                  disabled={loading || counts.new + counts.update === 0}
                  onClick={handleCommit}
                >
                  {loading ? "Importing…" : `Import ${counts.new + counts.update} rows`}
                </button>
              </div>
            </div>
          )}

          {done !== null && (
            <div className="text-center">
              <p className="text-sm text-charcoal-100">Imported {done} contractor{done === 1 ? "" : "s"}.</p>
              <button className="btn-primary mt-4" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
