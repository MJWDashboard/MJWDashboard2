"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { uploadDocument } from "@/app/dashboard/documents/actions";
import { DocumentLink } from "@/app/dashboard/documents/DocumentLink";

type Doc = { id: string; file_name: string; file_path: string; category: string | null };

export function DealDocuments({
  dealId,
  buildingId,
  documents,
}: {
  dealId: string;
  buildingId: string;
  documents: Doc[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("building_id", buildingId);
    formData.set("leasing_deal_id", dealId);
    const result = await uploadDocument(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-sm font-semibold">Dealsheets &amp; Documents</h2>
      {documents.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {documents.map((d) => (
            <li key={d.id} className="text-sm">
              <DocumentLink path={d.file_path} fileName={d.file_name} />
              {d.category && <span className="ml-2 text-xs text-charcoal-400">{d.category}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-charcoal-400">No documents attached yet.</p>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input type="file" name="file" required className="input flex-1" />
        <input name="category" className="input w-40" placeholder="e.g. Signed Dealsheet" />
        <button type="submit" disabled={loading} className="btn-secondary">
          <Upload size={16} />
          {loading ? "Uploading…" : "Upload"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
