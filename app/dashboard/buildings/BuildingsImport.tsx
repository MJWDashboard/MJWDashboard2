"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileWarning } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/StatusBadge";
import { booleanValue, downloadErrorWorkbook, field, numberValue, textValue, type ImportPreviewRow } from "@/lib/imports";
import { commitBuildingImport, getBuildingImportMatchingData, type BuildingImportData } from "./actions";

export function BuildingsImportButton() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportPreviewRow<BuildingImportData>[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; rejected: number; batchId?: string } | null>(null);
  const router = useRouter();

  async function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setLoading(true); setError(null); setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
      const { portfolios, buildings } = await getBuildingImportMatchingData();
      setRows(raw.map((source, index) => {
        const portfolioName = textValue(field(source, "Portfolio"));
        const code = textValue(field(source, "Building Code")).toUpperCase();
        const name = textValue(field(source, "Building Name"));
        const portfolio = portfolios.find((item) => item.name.toLowerCase() === portfolioName.toLowerCase());
        const existing = portfolio && buildings.find((item) => item.portfolio_id === portfolio.id && item.building_code?.toUpperCase() === code);
        const errors = [] as { field: string; value: string; reason: string }[];
        if (!portfolio) errors.push({ field: "Portfolio", value: portfolioName, reason: "Portfolio not found or not accessible" });
        if (!code) errors.push({ field: "Building Code", value: code, reason: "Building Code is required" });
        if (!name) errors.push({ field: "Building Name", value: name, reason: "Building Name is required" });
        const data: BuildingImportData = {
          portfolioId: portfolio?.id ?? "", buildingCode: code, name,
          addressLine1: textValue(field(source, "Address Line 1")), addressLine2: textValue(field(source, "Address Line 2")),
          suburb: textValue(field(source, "Suburb")), city: textValue(field(source, "City")), province: textValue(field(source, "Province")),
          postalCode: textValue(field(source, "Postal Code")), gla: numberValue(field(source, "GLA (m²)", "GLA (m2)")),
          budgetYear: numberValue(field(source, "Budget Year")), annualBudget: numberValue(field(source, "Annual Budget (R)")),
          active: booleanValue(field(source, "Active")), notes: textValue(field(source, "Notes")),
        };
        return { rowNumber: index + 2, action: errors.length ? "reject" : existing ? "update" : "create", matchKey: `${portfolioName} + ${code}`, data, recordId: existing?.id, errors, warnings: [] };
      }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not read file."); }
    finally { setLoading(false); }
  }

  async function commit() {
    if (!rows) return; setLoading(true); setError(null);
    const response = await commitBuildingImport(rows, fileName); setLoading(false);
    if (response.error) return setError(response.error);
    setResult(response); router.refresh();
  }
  const counts = rows && { valid: rows.filter((r) => !r.errors.length).length, created: rows.filter((r) => r.action === "create").length, updated: rows.filter((r) => r.action === "update").length, rejected: rows.filter((r) => r.errors.length).length };
  return <>
    <button className="btn-secondary" onClick={() => { setOpen(true); setRows(null); setResult(null); setError(null); }}><Upload size={16}/>Upload Data</button>
    {open && <Modal title="Import Buildings · VOREXA-BUILDINGS-v1" onClose={() => setOpen(false)}>
      {!rows && !result && <div><p className="mb-4 text-sm text-charcoal-300">Upload the canonical Buildings .xlsx or .csv template. Records match on Portfolio + Building Code.</p><input className="input" type="file" accept=".xlsx,.xls,.csv" onChange={selectFile}/>{loading && <p className="mt-3 text-sm">Validating…</p>}</div>}
      {rows && counts && !result && <div>
        <div className="mb-4 flex flex-wrap gap-2"><Badge label={`${rows.length} total`} className="bg-charcoal-600/60 text-charcoal-200"/><Badge label={`${counts.valid} valid`} className="bg-green-500/20 text-green-400"/><Badge label={`${counts.created} create`} className="bg-cyan-600/20 text-cyan-400"/><Badge label={`${counts.updated} update`} className="bg-yellow-500/20 text-yellow-400"/><Badge label={`${counts.rejected} rejected`} className="bg-red-500/20 text-red-400"/></div>
        <div className="max-h-80 overflow-auto rounded-md border border-charcoal-700"><table className="table-base"><thead><tr><th>Row</th><th>Code</th><th>Building</th><th>Result</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.data.buildingCode || "—"}</td><td>{row.data.name || "—"}</td><td className={row.errors.length ? "text-red-400" : "text-charcoal-300"}>{row.errors[0]?.reason ?? row.action}</td></tr>)}</tbody></table></div>
        {counts.rejected > 0 && <button className="btn-secondary mt-4" onClick={() => downloadErrorWorkbook("buildings", rows)}><FileWarning size={16}/>Download Error Report</button>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}<div className="mt-4 flex justify-end gap-3"><button className="btn-secondary" onClick={() => setRows(null)}>Choose Different File</button><button className="btn-primary" disabled={loading || !counts.valid} onClick={commit}>{loading ? "Importing…" : `Confirm ${counts.valid} rows`}</button></div>
      </div>}
      {result && <div className="text-center"><p className="text-charcoal-100">{result.created + result.updated + result.rejected} rows processed · {result.updated} updated · {result.created} created · {result.rejected} rejected</p>{result.batchId && <p className="mt-2 text-xs text-charcoal-400">Batch {result.batchId}</p>}<button className="btn-primary mt-4" onClick={() => setOpen(false)}>Done</button></div>}
      {error && !rows && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </Modal>}
  </>;
}
