"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createImportantDate, updateImportantDate, type ImportantDateInput } from "./actions";

type ImportantDate = {
  id: string;
  title: string;
  building_id: string | null;
  tenant_id: string | null;
  date_type: string | null;
  due_date: string;
  status: string;
  notes: string | null;
};

const EMPTY: ImportantDateInput = {
  title: "",
  building_id: "",
  tenant_id: "",
  date_type: "",
  due_date: "",
  status: "not_started",
  notes: "",
};

function toInput(d?: ImportantDate | null, defaultDate?: string): ImportantDateInput {
  if (!d) return { ...EMPTY, due_date: defaultDate ?? "" };
  return {
    title: d.title ?? "",
    building_id: d.building_id ?? "",
    tenant_id: d.tenant_id ?? "",
    date_type: d.date_type ?? "",
    due_date: d.due_date,
    status: d.status ?? "not_started",
    notes: d.notes ?? "",
  };
}

export function ImportantDateFormButton({
  item,
  label,
  buildings,
  tenants,
  defaultDate,
  compact,
}: {
  item?: ImportantDate;
  label: string;
  buildings: { id: string; name: string }[];
  tenants: { id: string; trading_name: string }[];
  defaultDate?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ImportantDateInput>(toInput(item, defaultDate));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(item, defaultDate));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = item ? await updateImportantDate(item.id, values) : await createImportantDate(values);
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
      <button
        onClick={openModal}
        className={
          compact
            ? "block w-full truncate rounded bg-charcoal-700 px-1.5 py-0.5 text-left text-xs text-charcoal-100 hover:bg-charcoal-600"
            : item
              ? "btn-secondary"
              : "btn-primary"
        }
      >
        {label}
      </button>
      {open && (
        <Modal title={item ? "Edit Date" : "Add Important Date"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                required
                className="input"
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={values.due_date}
                  onChange={(e) => setValues({ ...values, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Type</label>
                <input
                  className="input"
                  placeholder="e.g. Lease Expiry, Compliance"
                  value={values.date_type}
                  onChange={(e) => setValues({ ...values, date_type: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Building</label>
                <select
                  className="input"
                  value={values.building_id}
                  onChange={(e) => setValues({ ...values, building_id: e.target.value })}
                >
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
                <select
                  className="input"
                  value={values.tenant_id}
                  onChange={(e) => setValues({ ...values, tenant_id: e.target.value })}
                >
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
              <label className="label">Status</label>
              <select
                className="input"
                value={values.status}
                onChange={(e) => setValues({ ...values, status: e.target.value })}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_on_feedback">Waiting</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                rows={2}
                className="input"
                value={values.notes}
                onChange={(e) => setValues({ ...values, notes: e.target.value })}
              />
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
