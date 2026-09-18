"use client";

import { useState } from "react";

export function AuditRow({
  when,
  who,
  action,
  tableName,
  recordId,
  fieldChanges,
}: {
  when: string;
  who: string;
  action: React.ReactNode;
  tableName: string;
  recordId: string | null;
  fieldChanges: unknown;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr>
        <td className="whitespace-nowrap text-charcoal-300">{when}</td>
        <td className="text-charcoal-100">{who}</td>
        <td>{action}</td>
        <td className="text-charcoal-300">{tableName}</td>
        <td className="text-xs text-charcoal-500">{recordId ? recordId.slice(0, 8) : "—"}</td>
        <td className="text-right">
          <button onClick={() => setOpen((o) => !o)} className="text-xs text-cyan-400 hover:underline">
            {open ? "Hide" : "View"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="bg-charcoal-900/60">
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all p-3 text-xs text-charcoal-300">
              {JSON.stringify(fieldChanges, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
