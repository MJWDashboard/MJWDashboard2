"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { uploadBuildingPlan } from "../actions";
import { getDocumentUrl } from "@/app/dashboard/documents/actions";
import { MAX_DOCUMENT_BYTES, formatBytes } from "@/lib/uploadLimits";

export type BuildingPlan = { id: string; file_name: string; file_path: string; uploaded_at: string };

function ViewPlanButton({ path, fileName }: { path: string; fileName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const { url } = await getDocumentUrl(path);
    setLoading(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button onClick={handleClick} disabled={loading} className="flex items-center gap-2 text-cyan-400 hover:underline">
      <FileText size={15} />
      {loading ? "Opening…" : fileName}
    </button>
  );
}

export function BuildingPlans({ buildingId, plans }: { buildingId: string; plans: BuildingPlan[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(`File is ${formatBytes(file.size)} - documents are limited to 20 MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    const result = await uploadBuildingPlan(buildingId, formData);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Building Plans</h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-cyan-400 hover:underline">
          <Upload size={14} />
          {loading ? "Uploading…" : "Upload Plan"}
          <input ref={inputRef} type="file" className="hidden" disabled={loading} onChange={handleFileChange} />
        </label>
      </div>
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
      {plans.length > 0 ? (
        <ul className="space-y-2">
          {plans.map((p) => (
            <li key={p.id} className="text-sm">
              <ViewPlanButton path={p.file_path} fileName={p.file_name} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-charcoal-400">No building plans uploaded yet.</p>
      )}
    </section>
  );
}
