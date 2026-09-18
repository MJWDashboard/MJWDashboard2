"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createArrearsRecord, updateArrearsRecord, type ArrearsRecordInput } from "./actions";

type ArrearsRecord = {
  id: string;
  building_id: string;
  tenant_id: string | null;
  debtor_name: string | null;
  account_number: string | null;
  current_balance: number;
  days_30: number | null;
  days_60: number | null;
  days_90_plus: number | null;
  status: string;
  risk: boolean;
};

const EMPTY: ArrearsRecordInput = {
  building_id: "",
  tenant_id: "",
  debtor_name: "",
  account_number: "",
  current_balance: "0",
  days_30: "0",
  days_60: "0",
  days_90_plus: "0",
  status: "not_started",
  risk: false,
};

function toInput(record?: ArrearsRecord | null): ArrearsRecordInput {
  if (!record) return EMPTY;
  return {
    building_id: record.building_id,
    tenant_id: record.tenant_id ?? "",
    debtor_name: record.debtor_name ?? "",
    account_number: record.account_number ?? "",
    current_balance: String(record.current_balance ?? 0),
    days_30: String(record.days_30 ?? 0),
    days_60: String(record.days_60 ?? 0),
    days_90_plus: String(record.days_90_plus ?? 0),
    status: record.status ?? "not_started",
    risk: record.risk ?? false,
  };
}

export function ArrearsRecordFormButton({
  record,
  label,
  buildings,
  tenants,
}: {
  record?: ArrearsRecord;
  label: string;
  buildings: { id: string; name: string }[];
  tenants: { id: string; building_id: string; trading_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ArrearsRecordInput>(toInput(record));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(record));
    setError(null);
    setOpen(true);
  }

  function set<K extends keyof ArrearsRecordInput>(key: K, value: ArrearsRecordInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = record ? await updateArrearsRecord(record.id, values) : await createArrearsRecord(values);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const buildingTenants = tenants.filter((t) => t.building_id === values.building_id);

  return (
    <>
      <button onClick={openModal} className={record ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={record ? "Edit Arrears Record" : "Add Arrears Record"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Building</label>
              <select
                required
                className="input"
                value={values.building_id}
                onChange={(e) => set("building_id", e.target.value)}
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
            <div>
              <label className="label">Debtor Name</label>
              <input
                required
                className="input"
                value={values.debtor_name}
                onChange={(e) => set("debtor_name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Account Number</label>
                <input
                  className="input"
                  value={values.account_number}
                  onChange={(e) => set("account_number", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Link to Tenant</label>
                <select
                  className="input"
                  value={values.tenant_id}
                  onChange={(e) => set("tenant_id", e.target.value)}
                >
                  <option value="">— Unmatched —</option>
                  {buildingTenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trading_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="label">Balance</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.current_balance}
                  onChange={(e) => set("current_balance", e.target.value)}
                />
              </div>
              <div>
                <label className="label">30 Days</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.days_30}
                  onChange={(e) => set("days_30", e.target.value)}
                />
              </div>
              <div>
                <label className="label">60 Days</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.days_60}
                  onChange={(e) => set("days_60", e.target.value)}
                />
              </div>
              <div>
                <label className="label">90+ Days</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.days_90_plus}
                  onChange={(e) => set("days_90_plus", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Status</label>
                <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_on_feedback">Waiting on Feedback</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm text-charcoal-300">
                <input type="checkbox" checked={values.risk} onChange={(e) => set("risk", e.target.checked)} />
                Flag as risk
              </label>
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
