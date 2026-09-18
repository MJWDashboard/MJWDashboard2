"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createTurnover, updateTurnover, type TurnoverInput } from "./actions";

type Turnover = {
  id: string;
  tenant_id: string;
  building_id: string;
  unit: string | null;
  period: string;
  turnover_amount: number | null;
  turnover_rental: number | null;
  submitted: boolean;
  penalty_applicable: boolean;
  penalty_amount: number | null;
  penalty_status: string | null;
  notes: string | null;
};

const EMPTY: TurnoverInput = {
  tenant_id: "",
  building_id: "",
  unit: "",
  period: "",
  turnover_amount: "",
  turnover_rental: "",
  submitted: false,
  penalty_applicable: false,
  penalty_amount: "",
  penalty_status: "",
  notes: "",
};

function toInput(t?: Turnover | null): TurnoverInput {
  if (!t) return EMPTY;
  return {
    tenant_id: t.tenant_id,
    building_id: t.building_id,
    unit: t.unit ?? "",
    period: t.period,
    turnover_amount: t.turnover_amount?.toString() ?? "",
    turnover_rental: t.turnover_rental?.toString() ?? "",
    submitted: t.submitted,
    penalty_applicable: t.penalty_applicable ?? false,
    penalty_amount: t.penalty_amount?.toString() ?? "",
    penalty_status: t.penalty_status ?? "",
    notes: t.notes ?? "",
  };
}

export function TurnoverFormButton({
  turnover,
  label,
  tenants,
}: {
  turnover?: Turnover;
  label: string;
  tenants: { id: string; trading_name: string; building_id: string; shop_number: string | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<TurnoverInput>(toInput(turnover));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(turnover));
    setError(null);
    setOpen(true);
  }

  function onTenantChange(tenantId: string) {
    const tenant = tenants.find((t) => t.id === tenantId);
    setValues({
      ...values,
      tenant_id: tenantId,
      building_id: tenant?.building_id ?? "",
      unit: tenant?.shop_number ?? values.unit,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = turnover ? await updateTurnover(turnover.id, values) : await createTurnover(values);
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
      <button onClick={openModal} className={turnover ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={turnover ? "Edit Turnover" : "Add Turnover"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Tenant</label>
              <select
                required
                className="input"
                value={values.tenant_id}
                onChange={(e) => onTenantChange(e.target.value)}
              >
                <option value="" disabled>
                  Select a tenant
                </option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.trading_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Period</label>
                <input
                  type="month"
                  required
                  className="input"
                  value={values.period ? values.period.slice(0, 7) : ""}
                  onChange={(e) => setValues({ ...values, period: `${e.target.value}-01` })}
                />
                <p className="mt-1 text-xs text-charcoal-400">Due by the 7th of the following month</p>
              </div>
              <div>
                <label className="label">Unit</label>
                <input
                  className="input"
                  value={values.unit}
                  onChange={(e) => setValues({ ...values, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Turnover Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.turnover_amount}
                  onChange={(e) => setValues({ ...values, turnover_amount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Turnover Rental</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.turnover_rental}
                  onChange={(e) => setValues({ ...values, turnover_rental: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal-300">
              <input
                type="checkbox"
                checked={values.submitted}
                onChange={(e) => setValues({ ...values, submitted: e.target.checked })}
              />
              Submitted by tenant
            </label>

            <div className="rounded-md border border-charcoal-700 p-3">
              <label className="mb-3 flex items-center gap-2 text-sm text-charcoal-300">
                <input
                  type="checkbox"
                  checked={values.penalty_applicable}
                  onChange={(e) => setValues({ ...values, penalty_applicable: e.target.checked })}
                />
                Penalty applicable
              </label>
              {values.penalty_applicable && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Penalty Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={values.penalty_amount}
                      onChange={(e) => setValues({ ...values, penalty_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Penalty Status</label>
                    <select
                      className="input"
                      value={values.penalty_status}
                      onChange={(e) => setValues({ ...values, penalty_status: e.target.value })}
                    >
                      <option value="">—</option>
                      <option value="charged">Charged</option>
                      <option value="waived">Waived</option>
                      <option value="under_discussion">Under Discussion</option>
                    </select>
                  </div>
                </div>
              )}
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
