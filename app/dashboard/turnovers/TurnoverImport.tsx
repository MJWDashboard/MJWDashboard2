"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileWarning, Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/StatusBadge";
import { booleanValue, downloadErrorWorkbook, field, numberValue, textValue, type ImportPreviewRow } from "@/lib/imports";
import { commitTurnoverImport, getTurnoverImportMatchingData, type TurnoverImportData } from "./actions";

function dateValue(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = textValue(value); const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function periodValue(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 7);
  const raw = textValue(value); const match = raw.match(/(\d{4})[-/]?(\d{1,2})/);
  return match ? `${match[1]}-${match[2].padStart(2, "0")}` : "";
}

export function TurnoverImportButton() {
  const [open, setOpen] = useState(false); const [rows, setRows] = useState<ImportPreviewRow<TurnoverImportData>[] | null>(null);
  const [fileName, setFileName] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; rejected: number; batchId?: string } | null>(null); const router = useRouter();
  async function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return; setLoading(true); setError(null); setFileName(file.name);
    try {
      const XLSX = await import("xlsx"); const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      const matching = await getTurnoverImportMatchingData();
      setRows(raw.map((source, index) => {
        const buildingCode = textValue(field(source, "Building Code")).toUpperCase(); const accountNumber = textValue(field(source, "Tenant Account Number", "Account Number"));
        const period = periodValue(field(source, "Period")); const building = matching.buildings.find((b) => b.building_code?.toUpperCase() === buildingCode);
        const tenant = building && matching.tenants.find((t) => t.building_id === building.id && t.account_number?.trim() === accountNumber);
        const existing = tenant && matching.turnovers.find((item) => item.tenant_id === tenant.id && item.period.slice(0, 7) === period);
        const errors = [] as { field: string; value: string; reason: string }[]; const warnings = [] as { field: string; value: string; reason: string }[];
        if (!building) errors.push({ field: "Building Code", value: buildingCode, reason: "Building not found" });
        if (!accountNumber) errors.push({ field: "Tenant Account Number", value: accountNumber, reason: "Account number is required" });
        else if (building && !tenant) errors.push({ field: "Tenant Account Number", value: accountNumber, reason: "No tenant matched in this building" });
        if (!period) errors.push({ field: "Period", value: textValue(field(source, "Period")), reason: "Use YYYY-MM" });
        if (existing) warnings.push({ field: "Period", value: period, reason: `Existing turnover found (${existing.turnover_amount ?? "blank"}) and will be updated` });
        const suppliedPenalty = field(source, "Penalty Applicable");
        const data: TurnoverImportData = { buildingId: building?.id ?? "", tenantId: tenant?.id ?? "", buildingCode, accountNumber,
          tradingName: textValue(field(source, "Trading Name")) || tenant?.trading_name || "", shopNumber: textValue(field(source, "Shop Number")) || tenant?.shop_number || "", period,
          turnoverAmount: numberValue(field(source, "Turnover Amount (R)")), turnoverRental: numberValue(field(source, "Turnover Rental (R)")), submitted: booleanValue(field(source, "Submitted by Tenant")),
          submissionDate: dateValue(field(source, "Submission Date")), penaltyApplicable: suppliedPenalty === "" ? Boolean(tenant?.turnover_penalty_clause) : booleanValue(suppliedPenalty),
          penaltyAmount: numberValue(field(source, "Penalty Amount (R)")) ?? tenant?.turnover_penalty_amount ?? null, notes: textValue(field(source, "Notes")) };
        return { rowNumber: index + 2, action: errors.length ? "reject" : existing ? "update" : "create", matchKey: `${buildingCode} + ${accountNumber} + ${period}`, data, recordId: existing?.id, errors, warnings };
      }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read file."); } finally { setLoading(false); }
  }
  async function commit() { if (!rows) return; setLoading(true); const response = await commitTurnoverImport(rows, fileName); setLoading(false); if (response.error) return setError(response.error); setResult(response); router.refresh(); }
  const counts = rows && { valid: rows.filter((r) => !r.errors.length).length, create: rows.filter((r) => r.action === "create").length, update: rows.filter((r) => r.action === "update").length, rejected: rows.filter((r) => r.errors.length).length, warnings: rows.filter((r) => r.warnings.length).length };
  return <><button className="btn-secondary" onClick={() => { setOpen(true); setRows(null); setResult(null); setError(null); }}><Upload size={16}/>Upload Data</button>{open && <Modal title="Import Turnovers · VOREXA-TURNOVERS-v1" onClose={() => setOpen(false)}>
    {!rows && !result && <div><p className="mb-4 text-sm text-charcoal-300">Records match on Building Code + Tenant Account Number + Period. Existing months are shown before update.</p><input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={selectFile}/>{loading && <p className="mt-3 text-sm">Validating…</p>}</div>}
    {rows && counts && !result && <div><div className="mb-4 flex flex-wrap gap-2"><Badge label={`${rows.length} total`} className="bg-charcoal-600/60 text-charcoal-200"/><Badge label={`${counts.valid} valid`} className="bg-green-500/20 text-green-400"/><Badge label={`${counts.create} create`} className="bg-cyan-600/20 text-cyan-400"/><Badge label={`${counts.update} update`} className="bg-yellow-500/20 text-yellow-400"/><Badge label={`${counts.rejected} rejected`} className="bg-red-500/20 text-red-400"/></div>
      <div className="max-h-80 overflow-auto rounded-md border border-charcoal-700"><table className="table-base"><thead><tr><th>Tenant</th><th>Period</th><th>Uploaded</th><th>Result</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowNumber}><td>{row.data.tradingName || row.data.accountNumber || "—"}</td><td>{row.data.period || "—"}</td><td>{row.data.turnoverAmount ?? "—"}</td><td className={row.errors.length ? "text-red-400" : row.warnings.length ? "text-yellow-400" : "text-charcoal-300"}>{row.errors[0]?.reason ?? row.warnings[0]?.reason ?? row.action}</td></tr>)}</tbody></table></div>
      {(counts.rejected > 0 || counts.warnings > 0) && <button className="btn-secondary mt-4" onClick={() => downloadErrorWorkbook("turnovers", rows)}><FileWarning size={16}/>Download Exception Report</button>}{error && <p className="mt-3 text-sm text-red-400">{error}</p>}<div className="mt-4 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setRows(null)}>Choose Different File</button><button className="btn-primary" disabled={loading || !counts.valid} onClick={commit}>{loading ? "Importing…" : `Confirm ${counts.valid} rows`}</button></div></div>}
    {result && <div className="text-center"><p>{result.created + result.updated + result.rejected} rows processed · {result.updated} updated · {result.created} created · {result.rejected} rejected</p>{result.batchId && <p className="mt-2 text-xs text-charcoal-400">Batch {result.batchId}</p>}<button className="btn-primary mt-4" onClick={() => setOpen(false)}>Done</button></div>}{error && !rows && <p className="mt-3 text-sm text-red-400">{error}</p>}
  </Modal>}</>;
}
