"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reverseImportBatch } from "./actions";
import { REVERSIBLE_IMPORT_MODULES } from "@/lib/import-modules";

export function ImportBatchRow({ batch }: { batch: any }) {
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const router = useRouter();
  async function reverse() {
    if (!window.confirm(`Reverse import ${batch.filename}? Created records will be archived and updated records restored.`)) return;
    setLoading(true); setError(null); const result = await reverseImportBatch(batch.id); setLoading(false);
    if (result.error) return setError(result.error); router.refresh();
  }
  const canReverse = batch.status === "committed" && REVERSIBLE_IMPORT_MODULES.has(batch.module);
  return <><tr><td>{new Date(batch.created_at).toLocaleString()}</td><td className="capitalize">{batch.module}</td><td>{batch.filename}</td><td className="font-mono text-xs">{batch.id.slice(0, 8)}</td><td>{batch.rows_created} / {batch.rows_updated} / {batch.rows_rejected}</td><td className="capitalize">{batch.status}</td><td className="text-right">{canReverse && <button className="text-xs text-red-400 hover:underline" disabled={loading} onClick={reverse}>{loading ? "Reversing…" : "Reverse"}</button>}</td></tr>{error && <tr><td colSpan={7} className="text-sm text-red-400">{error}</td></tr>}</>;
}
