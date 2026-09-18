"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { parseArrearsRows, categorizeArrearsRows, type CategorizedArrearsRow } from "./importUtils";
import { getArrearsMatchingData, commitArrearsImport } from "./actions";

type Tenant = { id: string; building_id: string; trading_name: string; account_number: string | null };

export function ArrearsImportButton({ buildings }: { buildings: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CategorizedArrearsRow[] | null>(null);
  const [tenantsByBuilding, setTenantsByBuilding] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Record<number, string>>({});
  const [asOfMonth, setAsOfMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const router = useRouter();

  function reset() {
    setRows(null);
    setError(null);
    setDone(null);
    setSelectedTenant({});
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
      const parsed = parseArrearsRows(sheetRows);
      const { current, tenants } = await getArrearsMatchingData();
      const categorized = categorizeArrearsRows(parsed, buildings, current as any, tenants as any);
      setRows(categorized);
      setTenantsByBuilding(tenants as any);
      const initial: Record<number, string> = {};
      categorized.forEach((r, i) => {
        if (r.tenantId) initial[i] = r.tenantId;
      });
      setSelectedTenant(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!rows) return;
    setLoading(true);
    const importable = rows.filter((r) => !r.needsReview && r.buildingId);
    const result = await commitArrearsImport(
      importable.map((r, i) => {
        const idx = rows.indexOf(r);
        const tenantId = selectedTenant[idx] || null;
        return {
          existingId: r.existingId,
          buildingId: r.buildingId!,
          debtorName: r.debtorName,
          accountNumber: r.accountNumber,
          currentBalance: r.currentBalance,
          days30: r.days30,
          days60: r.days60,
          days90Plus: r.days90Plus,
          asOfMonth: `${asOfMonth}-01`,
          tenantId,
          matchStatus: tenantId ? "matched" : "unmatched",
        };
      })
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
        matched: rows.filter((r) => r.matchStatus === "matched").length,
        possible: rows.filter((r) => r.matchStatus === "possible").length,
        unmatched: rows.filter((r) => r.matchStatus === "unmatched" && !r.needsReview).length,
        review: rows.filter((r) => r.needsReview).length,
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
        Upload Arrears
      </button>
      {open && (
        <Modal title="Import Arrears" onClose={() => setOpen(false)}>
          {!rows && (
            <div>
              <p className="mb-4 text-sm text-charcoal-300">
                Upload the monthly arrears export. Financial figures update
                the current position for each debtor - existing arrears
                notes are never touched. Debtors are matched to Tenant
                Master records by account number or name where possible.
              </p>
              <div className="mb-4">
                <label className="label">As Of Month</label>
                <input
                  type="month"
                  className="input w-48"
                  value={asOfMonth}
                  onChange={(e) => setAsOfMonth(e.target.value)}
                />
              </div>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="input" />
              {loading && <p className="mt-3 text-sm text-charcoal-400">Reading file…</p>}
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            </div>
          )}

          {rows && counts && done === null && (
            <div>
              <div className="mb-4 flex flex-wrap gap-3 text-sm">
                <Badge label={`${counts.matched} matched`} className="bg-green-500/20 text-green-400" />
                <Badge label={`${counts.possible} possible`} className="bg-yellow-500/20 text-yellow-400" />
                <Badge label={`${counts.unmatched} unmatched`} className="bg-charcoal-600/60 text-charcoal-200" />
                <Badge label={`${counts.review} need review`} className="bg-red-500/20 text-red-400" />
              </div>
              <div className="max-h-80 overflow-y-auto rounded-md border border-charcoal-700">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Debtor</th>
                      <th>Balance</th>
                      <th>Match</th>
                      <th>Link to Tenant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>
                          {r.debtorName || "—"}
                          {r.reason && <p className="text-xs text-red-400">{r.reason}</p>}
                        </td>
                        <td>{formatCurrency(Number(r.currentBalance) || 0)}</td>
                        <td className="capitalize text-xs">{r.needsReview ? "review" : r.matchStatus}</td>
                        <td>
                          {!r.needsReview && r.buildingId && (
                            <select
                              className="input w-48 py-1 text-xs"
                              value={selectedTenant[i] ?? ""}
                              onChange={(e) => setSelectedTenant((s) => ({ ...s, [i]: e.target.value }))}
                            >
                              <option value="">— Unmatched —</option>
                              {tenantsByBuilding
                                .filter((t) => t.building_id === r.buildingId)
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.trading_name}
                                  </option>
                                ))}
                            </select>
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
                <button className="btn-primary" disabled={loading} onClick={handleCommit}>
                  {loading ? "Importing…" : "Import"}
                </button>
              </div>
            </div>
          )}

          {done !== null && (
            <div className="text-center">
              <p className="text-sm text-charcoal-100">Updated {done} arrears record{done === 1 ? "" : "s"}.</p>
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
