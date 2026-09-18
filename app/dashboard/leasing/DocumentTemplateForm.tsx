"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createDocumentTemplate, updateDocumentTemplate, archiveDocumentTemplate } from "./actions";

type Template = { id: string; name: string; items: string[] };

export function DocumentTemplateFormButton({ template, label }: { template?: Template; label: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(template?.name ?? "");
  const [itemsText, setItemsText] = useState((template?.items ?? []).join("\n"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setName(template?.name ?? "");
    setItemsText((template?.items ?? []).join("\n"));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const items = itemsText
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean);
    const result = template
      ? await updateDocumentTemplate(template.id, name, items)
      : await createDocumentTemplate(name, items);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleArchive() {
    if (!template) return;
    setLoading(true);
    await archiveDocumentTemplate(template.id);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={openModal} className={template ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={template ? "Edit Document Template" : "New Document Template"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Template Name</label>
              <input
                required
                className="input"
                placeholder="e.g. Standard Retail Lease Requirements"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Required Documents (one per line)</label>
              <textarea
                rows={8}
                className="input"
                placeholder={"FICA - ID Copy\nCompany Registration\nLatest Financials\nBank Confirmation Letter"}
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex items-center justify-between pt-2">
              {template ? (
                <button type="button" className="text-sm text-red-400 hover:underline" onClick={handleArchive}>
                  Archive Template
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
