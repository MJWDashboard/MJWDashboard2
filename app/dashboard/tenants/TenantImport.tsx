"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileWarning } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/StatusBadge";
import { downloadErrorWorkbook, type ImportPreviewRow } from "@/lib/imports";
import { parseTenantImportRows, type TenantImportData } from "./importUtils";
import { getTenantImportMatchingData, commitTenantImport } from "./actions";

export function TenantImportButton() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportPreviewRow<TenantImportData>[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; rejected: number; batchId?: string } | null>(null);
  const router = useRouter();

  async function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      const { buildings, tenants } = await getTenantImportMatchingData();
      setRows(parseTenantImportRows(raw, buildings, tenants));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read file.");
    } finally {
      setLoading(false);
    }
  }

  async function commit() {
    if (!rows) return;
    setLoading(true);
    setError(null);
    const response = await commitTenantImport(rows, fileName);
    setLoading(false);
    if (response.error) return setError(response.error);
    setResult(response);
    router.refresh();
  }

  const counts = rows && {
    valid: rows.filter((r) => !r.errors.length).length,
    create: rows.filter((r) => r.action === "create").length,
    update: rows.filter((r) => r.action === "update").length,
    rejected: rows.filter((r) => r.errors.length).length,
    warnings: rows.filter((r) => r.warnings.length).length,
  };

  return (
    <>
      <button
        className="btn-secondary"
        onClick={() => {
          setOpen(true);
          setRows(null);
          setResult(null);
          setError(null);
        }}
      >
        <Upload size={16} />
        Import
      </button>

      {open && (
        <Modal title="Import Tenants · VOREXA-TENANTS-v2" onClose={() => setOpen(false)}>
          {!rows && !result && (
            <div>
              <p className="mb-4 text-sm text-charcoal-300">
                Upload the canonical Tenants .xlsx or .csv template. Records match on Building Code +
                Account Number (or Building Code + Shop Number + Trading Name where an account number
                isn&apos;t available). Rows sharing an account number are combined into one tenant.
              </p>
              <input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={selectFile} />
              {loading && <p className="mt-3 text-sm">Validating…</p>}
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            </div>
          )}

          {rows && counts && !result && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge label={`${rows.length} total`} className="bg-charcoal-600/60 text-charcoal-200" />
                <Badge label={`${counts.valid} valid`} className="bg-green-500/20 text-green-400" />
                <Badge label={`${counts.create} create`} className="bg-cyan-600/20 text-cyan-400" />
                <Badge label={`${counts.update} update`} className="bg-yellow-500/20 text-yellow-400" />
                <Badge label={`${counts.rejected} rejected`} className="bg-red-500/20 text-red-400" />
                {counts.warnings > 0 && (
                  <Badge label={`${counts.warnings} warnings`} className="bg-yellow-500/20 text-yellow-400" />
                )}
              </div>

              <div className="max-h-80 overflow-auto rounded-md border border-charcoal-700">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Building</th>
                      <th>Tenant</th>
                      <th>Account</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        <td>{row.data.buildingCode || "—"}</td>
                        <td>{row.data.tradingName || "—"}</td>
                        <td>{row.data.accountNumber || row.data.shopNumber || "—"}</td>
                        <td className={row.errors.length ? "text-red-400" : row.warnings.length ? "text-yellow-400" : "text-charcoal-300"}>
                          {row.errors[0]?.reason ?? row.warnings[0]?.reason ?? row.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {counts.rejected > 0 && (
                <button className="btn-secondary mt-4" onClick={() => downloadErrorWorkbook("tenants", rows)}>
                  <FileWarning size={16} />
                  Download Error Report
                </button>
              )}
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              <div className="mt-4 flex justify-end gap-3">
                <button className="btn-secondary" onClick={() => setRows(null)}>
                  Choose Different File
                </button>
                <button className="btn-primary" disabled={loading || !counts.valid} onClick={commit}>
                  {loading ? "Importing…" : `Confirm ${counts.valid} rows`}
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="text-center">
              <p className="text-charcoal-100">
                {result.created + result.updated + result.rejected} rows processed · {result.created} created ·{" "}
                {result.updated} updated · {result.rejected} rejected
              </p>
              {result.batchId && <p className="mt-2 text-xs text-charcoal-400">Batch {result.batchId}</p>}
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
