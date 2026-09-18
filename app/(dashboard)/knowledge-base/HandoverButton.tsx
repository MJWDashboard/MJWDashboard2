"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { generateHandoverSummary } from "./actions";

export function GenerateHandoverButton({ buildings }: { buildings: { id: string; name: string }[] }) {
  const [buildingId, setBuildingId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    if (!buildingId) return;
    setLoading(true);
    await generateHandoverSummary(buildingId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select className="input w-auto text-sm" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
        <option value="">Select building…</option>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <button onClick={handleGenerate} disabled={!buildingId || loading} className="btn-secondary">
        <FileText size={16} />
        {loading ? "Generating…" : "Generate Handover"}
      </button>
    </div>
  );
}
