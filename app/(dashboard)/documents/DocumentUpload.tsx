"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { uploadDocument } from "./actions";

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
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
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
              <input name="category" className="input" placeholder="e.g. Lease, Compliance, Invoice" />
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
