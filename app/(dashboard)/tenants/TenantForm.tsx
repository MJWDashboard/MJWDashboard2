"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createTenant, updateTenant, type TenantInput } from "./actions";

type Tenant = {
  id: string;
  building_id: string;
  trading_name: string;
  shop_number: string | null;
  gla: number | null;
  monthly_rental: number | null;
  lease_start: string | null;
  lease_end: string | null;
  status: string;
  notes: string | null;
};

const STATUS_OPTIONS = [
  ["not_started", "Not Started"],
  ["in_progress", "In Progress"],
  ["waiting_on_feedback", "Waiting on Feedback"],
  ["complete", "Complete"],
];

function toInput(tenant?: Tenant | null, defaultBuildingId?: string): TenantInput {
  if (!tenant) {
    return {
      building_id: defaultBuildingId ?? "",
      trading_name: "",
      shop_number: "",
      gla: "",
      monthly_rental: "",
      lease_start: "",
      lease_end: "",
      status: "not_started",
      notes: "",
    };
  }
  return {
    building_id: tenant.building_id,
    trading_name: tenant.trading_name ?? "",
    shop_number: tenant.shop_number ?? "",
    gla: tenant.gla?.toString() ?? "",
    monthly_rental: tenant.monthly_rental?.toString() ?? "",
    lease_start: tenant.lease_start ?? "",
    lease_end: tenant.lease_end ?? "",
    status: tenant.status ?? "not_started",
    notes: tenant.notes ?? "",
  };
}

export function TenantFormButton({
  tenant,
  label,
  buildings,
  defaultBuildingId,
}: {
  tenant?: Tenant;
  label: string;
  buildings: { id: string; name: string }[];
  defaultBuildingId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<TenantInput>(toInput(tenant, defaultBuildingId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(tenant, defaultBuildingId));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = tenant
      ? await updateTenant(tenant.id, values)
      : await createTenant(values);

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
      <button onClick={openModal} className={tenant ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>

      {open && (
        <Modal title={tenant ? "Edit Tenant" : "Add Tenant"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Building</label>
              <select
                required
                className="input"
                value={values.building_id}
                onChange={(e) => setValues({ ...values, building_id: e.target.value })}
              >
                <option value="" disabled>
                  Select a building
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Trading Name</label>
                <input
                  required
                  className="input"
                  value={values.trading_name}
                  onChange={(e) => setValues({ ...values, trading_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Shop Number</label>
                <input
                  className="input"
                  value={values.shop_number}
                  onChange={(e) => setValues({ ...values, shop_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">GLA (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.gla}
                  onChange={(e) => setValues({ ...values, gla: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Monthly Rental</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.monthly_rental}
                  onChange={(e) => setValues({ ...values, monthly_rental: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Lease Start</label>
                <input
                  type="date"
                  className="input"
                  value={values.lease_start}
                  onChange={(e) => setValues({ ...values, lease_start: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Lease End</label>
                <input
                  type="date"
                  className="input"
                  value={values.lease_end}
                  onChange={(e) => setValues({ ...values, lease_end: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={values.status}
                onChange={(e) => setValues({ ...values, status: e.target.value })}
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                rows={3}
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
