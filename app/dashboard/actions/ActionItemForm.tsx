"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createActionItem, updateActionItem, type ActionItemInput } from "./actions";

type ActionItem = {
  id: string;
  title: string;
  description: string | null;
  building_id: string | null;
  tenant_id: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  risk: boolean;
};

const EMPTY: ActionItemInput = {
  title: "",
  description: "",
  building_id: "",
  tenant_id: "",
  priority: "medium",
  status: "not_started",
  due_date: "",
  risk: false,
};

function toInput(a?: ActionItem | null): ActionItemInput {
  if (!a) return EMPTY;
  return {
    title: a.title ?? "",
    description: a.description ?? "",
    building_id: a.building_id ?? "",
    tenant_id: a.tenant_id ?? "",
    priority: a.priority ?? "medium",
    status: a.status ?? "not_started",
    due_date: a.due_date ?? "",
    risk: a.risk ?? false,
  };
}

export function ActionItemFormButton({
  item,
  label,
  buildings,
  tenants,
}: {
  item?: ActionItem;
  label: string;
  buildings: { id: string; name: string }[];
  tenants: { id: string; trading_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ActionItemInput>(toInput(item));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(item));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = item ? await updateActionItem(item.id, values) : await createActionItem(values);
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
        <Modal title={item ? "Edit Action" : "Add Action"} onClose={() => setOpen(false)}>
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
            <div>
              <label className="label">Description</label>
              <textarea
                rows={2}
                className="input"
                value={values.description}
                onChange={(e) => setValues({ ...values, description: e.target.value })}
              />
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={values.priority}
                  onChange={(e) => setValues({ ...values, priority: e.target.value })}
                >
                  {["low", "medium", "high", "critical"].map((p) => (
                    <option key={p} value={p} className="capitalize">
                      {p}
                    </option>
                  ))}
                </select>
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
                <label className="label">Due Date</label>
                <input
                  type="date"
                  className="input"
                  value={values.due_date}
                  onChange={(e) => setValues({ ...values, due_date: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal-300">
              <input
                type="checkbox"
                checked={values.risk}
                onChange={(e) => setValues({ ...values, risk: e.target.checked })}
              />
              Flag as risk
            </label>
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
