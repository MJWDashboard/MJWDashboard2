"use client";

import { useState, useTransition } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import { importTransactionRows, saveImportTemplate, deleteImportTemplate } from "./actions";
import { FormSheet } from "./MoneyClient";

type Account = Tables<"accounts">;
type ImportTemplate = Tables<"import_templates">;

const FIELDS = ["date", "description", "amount", "merchant"] as const;
type Field = (typeof FIELDS)[number];

function parseCsv(text: string, delimiter: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, "")));
}

/** CSV import v2: raw file -> column mapping -> preview -> dedup'd insert.
 * Mappings can be saved as a reusable template (Phase 1 of the spec's
 * Financial Import — no bank-API or email-statement integration yet). */
export function ImportFormV2({ accounts, templates, onClose }: { accounts: Account[]; templates: ImportTemplate[]; onClose: () => void }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [delimiter, setDelimiter] = useState(",");
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<Field, string>>({ date: "", description: "", amount: "", merchant: "" });
  const [templateName, setTemplateName] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const headers = rows[0] ?? [];
  const dataRows = rows.slice(1);

  function handleFile(file: File) {
    file.text().then((text) => setRows(parseCsv(text, delimiter)));
  }

  function applyTemplate(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return;
    setDelimiter(t.delimiter);
    setMapping(t.column_mapping as Record<Field, string>);
  }

  function preview() {
    if (!mapping.date || !mapping.amount) return [];
    const dateIdx = headers.indexOf(mapping.date);
    const descIdx = headers.indexOf(mapping.description);
    const amountIdx = headers.indexOf(mapping.amount);
    const merchantIdx = mapping.merchant ? headers.indexOf(mapping.merchant) : -1;
    return dataRows
      .map((r) => ({
        occurred_at: r[dateIdx],
        description: descIdx >= 0 ? r[descIdx] ?? "" : "",
        amount: Number(r[amountIdx]?.replace(/[^0-9.-]/g, "")),
        merchant: merchantIdx >= 0 ? r[merchantIdx] ?? null : null,
      }))
      .filter((r) => r.occurred_at && !Number.isNaN(r.amount));
  }

  function doImport() {
    const parsed = preview();
    if (parsed.length === 0 || !accountId) return;
    startTransition(async () => {
      const res = await importTransactionRows(accountId, parsed);
      if (res.error) {
        setResult(res.error);
        return;
      }
      setResult(`Imported ${res.imported}, skipped ${res.duplicates} duplicate${res.duplicates === 1 ? "" : "s"}. New ones may need review.`);
      if (templateName.trim()) {
        await saveImportTemplate(templateName.trim(), mapping, delimiter);
      }
      setTimeout(onClose, 1400);
    });
  }

  const parsedRows = preview();

  return (
    <FormSheet title="Import CSV" onClose={onClose}>
      <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>

      {templates.length > 0 && (
        <select onChange={(e) => e.target.value && applyTemplate(e.target.value)} defaultValue="" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
          <option value="">Use a saved template...</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}

      <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="w-full text-sm text-muted" />

      {headers.length > 0 && (
        <>
          <p className="text-xs text-muted">Map your bank's columns to what Vorexa needs:</p>
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map((f) => (
              <select
                key={f}
                value={mapping[f]}
                onChange={(e) => setMapping((prev) => ({ ...prev, [f]: e.target.value }))}
                className="rounded-xl border border-border bg-background px-2 py-2 text-xs text-text"
              >
                <option value="">{f}{f !== "merchant" && f !== "description" ? " *" : ""}</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            ))}
          </div>

          {parsedRows.length > 0 && (
            <p className="text-xs text-ok">{parsedRows.length} rows ready to import.</p>
          )}

          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Save this mapping as a template (optional, e.g. 'ABSA cheque')"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />
        </>
      )}

      {result && <p className="text-xs text-text">{result}</p>}
      <button onClick={doImport} disabled={pending || parsedRows.length === 0} className="btn-primary w-full">
        {pending ? "Importing..." : `Import ${parsedRows.length || ""}`}
      </button>

      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => startTransition(() => deleteImportTemplate(t.id))}
              className="rounded-full border border-border px-2 py-1 text-[10px] text-muted hover:text-overdue"
            >
              Remove &quot;{t.name}&quot;
            </button>
          ))}
        </div>
      )}
    </FormSheet>
  );
}
