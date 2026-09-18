"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createTenant, updateTenant, type TenantInput } from "./actions";

type Tenant = Partial<TenantInput> & {
  id: string;
  building_id: string;
  trading_name: string;
};

const STATUS_OPTIONS = [
  ["not_started", "Not Started"],
  ["in_progress", "In Progress"],
  ["waiting_on_feedback", "Waiting on Feedback"],
  ["complete", "Complete"],
];

const FICA_OPTIONS = [
  ["pending", "Pending"],
  ["received", "Received"],
  ["not_required", "Not Required"],
];

const EMPTY: TenantInput = {
  building_id: "",
  trading_name: "",
  registered_entity: "",
  account_number: "",
  shop_number: "",
  gla: "",
  status: "not_started",
  monthly_rental: "",
  lease_start: "",
  lease_end: "",
  option_period: "",
  escalation_pct: "",
  escalation_date: "",
  operating_costs: "",
  rates: "",
  marketing_charge: "",
  other_charges: "",
  deposit_amount: "",
  deposit_type: "",
  bank_guarantee_reference: "",
  surety_name: "",
  surety_expiry: "",
  security_notes: "",
  fica_status: "pending",
  insurance_status: "pending",
  lease_signed: false,
  guarantee_received: false,
  deposit_received: false,
  surety_received: false,
  turnover_reporting_required: false,
  monthly_turnover_required: false,
  annual_turnover_required: false,
  turnover_pct: "",
  financial_year_end_month: "",
  financial_year_end_day: "",
  turnover_penalty_clause: "",
  turnover_penalty_amount: "",
  notes: "",
};

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

function toInput(tenant?: Tenant | null, defaultBuildingId?: string): TenantInput {
  if (!tenant) return { ...EMPTY, building_id: defaultBuildingId ?? "" };
  return {
    building_id: tenant.building_id,
    trading_name: tenant.trading_name ?? "",
    registered_entity: str(tenant.registered_entity),
    account_number: str(tenant.account_number),
    shop_number: str(tenant.shop_number),
    gla: str(tenant.gla),
    status: str(tenant.status) || "not_started",
    monthly_rental: str(tenant.monthly_rental),
    lease_start: str(tenant.lease_start),
    lease_end: str(tenant.lease_end),
    option_period: str(tenant.option_period),
    escalation_pct: str(tenant.escalation_pct),
    escalation_date: str(tenant.escalation_date),
    operating_costs: str(tenant.operating_costs),
    rates: str(tenant.rates),
    marketing_charge: str(tenant.marketing_charge),
    other_charges: str(tenant.other_charges),
    deposit_amount: str(tenant.deposit_amount),
    deposit_type: str(tenant.deposit_type),
    bank_guarantee_reference: str(tenant.bank_guarantee_reference),
    surety_name: str(tenant.surety_name),
    surety_expiry: str(tenant.surety_expiry),
    security_notes: str(tenant.security_notes),
    fica_status: str(tenant.fica_status) || "pending",
    insurance_status: str(tenant.insurance_status) || "pending",
    lease_signed: Boolean(tenant.lease_signed),
    guarantee_received: Boolean(tenant.guarantee_received),
    deposit_received: Boolean(tenant.deposit_received),
    surety_received: Boolean(tenant.surety_received),
    turnover_reporting_required: Boolean(tenant.turnover_reporting_required),
    monthly_turnover_required: Boolean(tenant.monthly_turnover_required),
    annual_turnover_required: Boolean(tenant.annual_turnover_required),
    turnover_pct: str(tenant.turnover_pct),
    financial_year_end_month: str(tenant.financial_year_end_month),
    financial_year_end_day: str(tenant.financial_year_end_day),
    turnover_penalty_clause: str(tenant.turnover_penalty_clause),
    turnover_penalty_amount: str(tenant.turnover_penalty_amount),
    notes: str(tenant.notes),
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-6 border-t border-charcoal-700 pt-5 text-xs font-semibold uppercase tracking-wide text-cyan-400 first:mt-0 first:border-t-0 first:pt-0">
      {children}
    </h3>
  );
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

  function set<K extends keyof TenantInput>(key: K, value: TenantInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

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
            <SectionTitle>Identification</SectionTitle>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Trading Name</label>
                <input
                  required
                  className="input"
                  value={values.trading_name}
                  onChange={(e) => set("trading_name", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Registered Entity</label>
                <input
                  className="input"
                  value={values.registered_entity}
                  onChange={(e) => set("registered_entity", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Account Number</label>
                <input
                  className="input"
                  value={values.account_number}
                  onChange={(e) => set("account_number", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Shop Number</label>
                <input
                  className="input"
                  value={values.shop_number}
                  onChange={(e) => set("shop_number", e.target.value)}
                />
              </div>
              <div>
                <label className="label">GLA (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.gla}
                  onChange={(e) => set("gla", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={values.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <SectionTitle>Lease</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Lease Start</label>
                <input
                  type="date"
                  className="input"
                  value={values.lease_start}
                  onChange={(e) => set("lease_start", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Lease End</label>
                <input
                  type="date"
                  className="input"
                  value={values.lease_end}
                  onChange={(e) => set("lease_end", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Option Period</label>
              <input
                className="input"
                placeholder="e.g. 1 x 3 years"
                value={values.option_period}
                onChange={(e) => set("option_period", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly Rental</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.monthly_rental}
                  onChange={(e) => set("monthly_rental", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Escalation %</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.escalation_pct}
                  onChange={(e) => set("escalation_pct", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Escalation Date</label>
                <input
                  type="date"
                  className="input"
                  value={values.escalation_date}
                  onChange={(e) => set("escalation_date", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Operating Costs</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.operating_costs}
                  onChange={(e) => set("operating_costs", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Rates</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.rates}
                  onChange={(e) => set("rates", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Marketing</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.marketing_charge}
                  onChange={(e) => set("marketing_charge", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Other Charges</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.other_charges}
                  onChange={(e) => set("other_charges", e.target.value)}
                />
              </div>
            </div>

            <SectionTitle>Security</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Deposit Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.deposit_amount}
                  onChange={(e) => set("deposit_amount", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Deposit Type</label>
                <input
                  className="input"
                  placeholder="Cash, Guarantee, Surety…"
                  value={values.deposit_type}
                  onChange={(e) => set("deposit_type", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Bank Guarantee Reference</label>
              <input
                className="input"
                value={values.bank_guarantee_reference}
                onChange={(e) => set("bank_guarantee_reference", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Surety Name</label>
                <input
                  className="input"
                  value={values.surety_name}
                  onChange={(e) => set("surety_name", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Surety Expiry</label>
                <input
                  type="date"
                  className="input"
                  value={values.surety_expiry}
                  onChange={(e) => set("surety_expiry", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Security Notes</label>
              <textarea
                rows={2}
                className="input"
                value={values.security_notes}
                onChange={(e) => set("security_notes", e.target.value)}
              />
            </div>

            <SectionTitle>Compliance</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">FICA Status</label>
                <select
                  className="input"
                  value={values.fica_status}
                  onChange={(e) => set("fica_status", e.target.value)}
                >
                  {FICA_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Insurance Status</label>
                <select
                  className="input"
                  value={values.insurance_status}
                  onChange={(e) => set("insurance_status", e.target.value)}
                >
                  {FICA_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="flex items-center gap-2 text-sm text-charcoal-300">
                <input
                  type="checkbox"
                  checked={values.lease_signed}
                  onChange={(e) => set("lease_signed", e.target.checked)}
                />
                Lease Signed
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal-300">
                <input
                  type="checkbox"
                  checked={values.deposit_received}
                  onChange={(e) => set("deposit_received", e.target.checked)}
                />
                Deposit Received
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal-300">
                <input
                  type="checkbox"
                  checked={values.guarantee_received}
                  onChange={(e) => set("guarantee_received", e.target.checked)}
                />
                Guarantee Received
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal-300">
                <input
                  type="checkbox"
                  checked={values.surety_received}
                  onChange={(e) => set("surety_received", e.target.checked)}
                />
                Surety Received
              </label>
            </div>

            <SectionTitle>Turnover Obligation</SectionTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-charcoal-300">
                <input
                  type="checkbox"
                  checked={values.turnover_reporting_required}
                  onChange={(e) => set("turnover_reporting_required", e.target.checked)}
                />
                Turnover Reporting Required
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal-300">
                <input
                  type="checkbox"
                  checked={values.monthly_turnover_required}
                  onChange={(e) => set("monthly_turnover_required", e.target.checked)}
                />
                Monthly Required
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal-300">
                <input
                  type="checkbox"
                  checked={values.annual_turnover_required}
                  onChange={(e) => set("annual_turnover_required", e.target.checked)}
                />
                Annual Certificate Required
              </label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Turnover %</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.turnover_pct}
                  onChange={(e) => set("turnover_pct", e.target.value)}
                />
              </div>
              <div>
                <label className="label">FYE Month</label>
                <select
                  className="input"
                  value={values.financial_year_end_month}
                  onChange={(e) => set("financial_year_end_month", e.target.value)}
                >
                  <option value="">—</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString("en-ZA", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">FYE Day</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  className="input"
                  value={values.financial_year_end_day}
                  onChange={(e) => set("financial_year_end_day", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Penalty Clause</label>
                <input
                  className="input"
                  value={values.turnover_penalty_clause}
                  onChange={(e) => set("turnover_penalty_clause", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Penalty Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.turnover_penalty_amount}
                  onChange={(e) => set("turnover_penalty_amount", e.target.value)}
                />
              </div>
            </div>

            <SectionTitle>Notes</SectionTitle>
            <textarea
              rows={3}
              className="input"
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
            />

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
