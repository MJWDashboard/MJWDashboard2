"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createSiteVisitItem, updateSiteVisitItem, type SiteVisitItemInput } from "./actions";
import { CATEGORIES } from "./constants";

type Item = {
  id: string;
  category: string;
  location: string | null;
  tenant_id: string | null;
  description: string;
  risk_level: string;
  priority: string;
  contractor_id: string | null;
  target_date: string | null;
  status: string;
  notes: string | null;
};

const EMPTY: Omit<SiteVisitItemInput, "site_visit_id"> = {
  category: "General",
  location: "",
  tenant_id: "",
  description: "",
  risk_level: "medium",
  priority: "medium",
  contractor_id: "",
  target_date: "",
  status: "open",
  notes: "",
};

function toInput(item?: Item | null): Omit<SiteVisitItemInput, "site_visit_id"> {
  if (!item) return EMPTY;
  return {
    category: item.category,
    location: item.location ?? "",
    tenant_id: item.tenant_id ?? "",
    description: item.description,
    risk_level: item.risk_level,
    priority: item.priority,
    contractor_id: item.contractor_id ?? "",
    target_date: item.target_date ?? "",
    status: item.status,
    notes: item.notes ?? "",
  };
}

export function InspectionItemFormButton({
  siteVisitId,
  item,
  label,
  tenants,
  contractors,
}: {
  siteVisitId: string;
  item?: Item;
  label: string;
  tenants: { id: string; trading_name: string }[];
  contractors: { id: string; trade: string | null; contacts: { name: string } | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(toInput(item));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function openModal() {
    setValues(toInput(item));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = item
      ? await updateSiteVisitItem(item.id, siteVisitId, { ...values, site_visit_id: siteVisitId })
      : await createSiteVisitItem({ ...values, site_visit_id: siteVisitId });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={openModal} className={item ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={item ? "Edit Inspection Item" : "Add Inspection Item"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select className="input" value={values.category} onChange={(e) => set("category", e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={values.location} onChange={(e) => set("location", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                required
                rows={2}
                className="input"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tenant / Unit</label>
                <select className="input" value={values.tenant_id} onChange={(e) => set("tenant_id", e.target.value)}>
                  <option value="">None</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trading_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Contractor</label>
                <select
                  className="input"
                  value={values.contractor_id}
                  onChange={(e) => set("contractor_id", e.target.value)}
                >
                  <option value="">None</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contacts?.name ?? c.trade ?? "Contractor"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Risk Level</label>
                <select className="input" value={values.risk_level} onChange={(e) => set("risk_level", e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={values.priority} onChange={(e) => set("priority", e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="label">Target Date</label>
                <input
                  type="date"
                  className="input"
                  value={values.target_date}
                  onChange={(e) => set("target_date", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea rows={2} className="input" value={values.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
