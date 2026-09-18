"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { uploadDocument } from "./actions";
import { MAX_DOCUMENT_BYTES, formatBytes } from "@/lib/uploadLimits";
import { DOCUMENT_CATEGORIES } from "@/lib/documentCategories";

export function DocumentUploadButton({
  buildings,
  tenants,
}: {
  buildings: { id: string; name: string }[];
  tenants: { id: string; trading_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;
    if (file && file.size > MAX_DOCUMENT_BYTES) {
      setError(`File is ${formatBytes(file.size)} - documents are limited to 20 MB.`);
      return;
    }

    setLoading(true);
    const result = await uploadDocument(formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Upload size={16} />
        Upload Document
      </button>
      {open && (
        <Modal title="Upload Document" onClose={() => setOpen(false)}>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">File</label>
              <input type="file" name="file" required className="input" />
              <p className="mt-1 text-xs text-charcoal-400">Maximum 20 MB.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Building</label>
                <select name="building_id" className="input">
                  <option value="">None</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tenant</label>
                <select name="tenant_id" className="input">
                  <option value="">None</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trading_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <select name="category" className="input" defaultValue="">
                <option value="">None</option>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
