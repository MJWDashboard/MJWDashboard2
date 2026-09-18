"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/StatusBadge";
import { parseSheetRows, categorizeRows, type CategorizedRow } from "./importUtils";
import { getExistingTenantsForImport, commitTenantImport } from "./actions";

export function TenantImportButton({
  buildings,
}: {
  buildings: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CategorizedRow[] | null>(null);
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
      const parsed = parseSheetRows(sheetRows);

      const { data: existingTenants } = await getExistingTenantsForImport();
      const categorized = categorizeRows(parsed, buildings, existingTenants);
      setRows(categorized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!rows) return;
    setLoading(true);
    setError(null);

    const importable = rows.filter((r) => r.category !== "needs_review" && r.buildingId);
    const result = await commitTenantImport(
      importable.map((r) => ({
        category: r.category as "new" | "update",
        buildingId: r.buildingId!,
        tenantId: r.tenantId,
        tradingName: r.tradingName,
        shopNumber: r.shopNumber,
        gla: r.gla,
        monthlyRental: r.monthlyRental,
        leaseStart: r.leaseStart,
        leaseEnd: r.leaseEnd,
      }))
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
        <Modal title="Import Tenants" onClose={() => setOpen(false)}>
          {!rows && (
            <div>
              <p className="mb-4 text-sm text-charcoal-300">
                Upload a .xlsx or .csv file with columns for Building, Trading
                Name, Shop Number, GLA, Monthly Rental, Lease Start and Lease
                End. Rows are matched by building + tenant name.
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                className="input"
              />
              {loading && <p className="mt-3 text-sm text-charcoal-400">Reading {fileName}…</p>}
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            </div>
          )}

          {rows && counts && done === null && (
            <div>
              <div className="mb-4 flex gap-3 text-sm">
                <Badge label={`${counts.new} new`} className="bg-green-500/20 text-green-400" />
                <Badge label={`${counts.update} update`} className="bg-cyan-600/20 text-cyan-400" />
                <Badge
                  label={`${counts.needs_review} needs review`}
                  className="bg-yellow-500/20 text-yellow-400"
                />
              </div>

              <div className="max-h-72 overflow-y-auto rounded-md border border-charcoal-700">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Tenant</th>
                      <th>Building</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.tradingName || "—"}</td>
                        <td>{r.buildingName || "—"}</td>
                        <td>
                          {r.category === "needs_review" ? (
                            <span className="text-xs text-yellow-400">{r.reason}</span>
                          ) : (
                            <span className="text-xs capitalize text-charcoal-300">
                              {r.category}
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
              <p className="text-sm text-charcoal-100">
                Imported {done} tenant{done === 1 ? "" : "s"} successfully.
              </p>
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
