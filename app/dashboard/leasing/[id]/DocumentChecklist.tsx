"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyDocumentTemplate, addDealDocumentItem, toggleDealDocumentReceived } from "../actions";

type Item = { id: string; document_name: string; received: boolean };
type Template = { id: string; name: string };

export function DocumentChecklist({
  dealId,
  items,
  templates,
}: {
  dealId: string;
  items: Item[];
  templates: Template[];
}) {
  const [templateId, setTemplateId] = useState("");
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApplyTemplate() {
    if (!templateId) return;
    setLoading(true);
    await applyDocumentTemplate(dealId, templateId);
    setLoading(false);
    setTemplateId("");
    router.refresh();
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    setLoading(true);
    await addDealDocumentItem(dealId, newItem);
    setLoading(false);
    setNewItem("");
    router.refresh();
  }

  async function handleToggle(item: Item) {
    await toggleDealDocumentReceived(item.id, dealId, !item.received);
    router.refresh();
  }

  const receivedCount = items.filter((i) => i.received).length;

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Document Checklist {items.length > 0 && `(${receivedCount}/${items.length})`}
        </h2>
      </div>

      {templates.length > 0 && (
        <div className="mb-4 flex gap-2">
          <select className="input flex-1" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Apply a template...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="btn-secondary" disabled={!templateId || loading} onClick={handleApplyTemplate}>
            Apply
          </button>
        </div>
      )}

      {items.length > 0 ? (
        <ul className="mb-4 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.received}
                onChange={() => handleToggle(item)}
                className="h-4 w-4"
              />
              <span className={item.received ? "text-charcoal-400 line-through" : "text-charcoal-100"}>
                {item.document_name}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-charcoal-400">No documents tracked yet.</p>
      )}

      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Add a required document..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button type="submit" disabled={loading || !newItem.trim()} className="btn-secondary">
          Add
        </button>
      </form>
    </div>
  );
}
