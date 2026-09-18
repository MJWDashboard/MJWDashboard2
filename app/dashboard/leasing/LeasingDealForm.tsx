"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createLeasingDeal, updateLeasingDeal, type LeasingDealInput } from "./actions";

type Deal = {
  id: string;
  building_id: string;
  tenant_id: string | null;
  vacant_unit_id: string | null;
  prospect_name: string | null;
  shop_number: string | null;
  stage: string;
  deal_value: number | null;
  enquiry_date: string | null;
  enquiry_source: string | null;
  requirements: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  unit_size_sqm: number | null;
  rate_per_sqm: number | null;
  lease_term_months: number | null;
  commencement_date: string | null;
  notes: string | null;
};

const STAGE_OPTIONS = ["enquiry", "offer", "negotiation", "signed", "declined", "withdrawn"];

const EMPTY: LeasingDealInput = {
  building_id: "",
  tenant_id: "",
  vacant_unit_id: "",
  prospect_name: "",
  shop_number: "",
  stage: "enquiry",
  deal_value: "",
  enquiry_date: new Date().toISOString().slice(0, 10),
  enquiry_source: "",
  requirements: "",
  contact_email: "",
  contact_phone: "",
  unit_size_sqm: "",
  rate_per_sqm: "",
  lease_term_months: "",
  commencement_date: "",
  notes: "",
};

function toInput(deal?: Deal | null, defaultBuildingId?: string): LeasingDealInput {
  if (!deal) return { ...EMPTY, building_id: defaultBuildingId ?? "" };
  return {
    building_id: deal.building_id,
    tenant_id: deal.tenant_id ?? "",
    vacant_unit_id: deal.vacant_unit_id ?? "",
    prospect_name: deal.prospect_name ?? "",
    shop_number: deal.shop_number ?? "",
    stage: deal.stage ?? "enquiry",
    deal_value: deal.deal_value?.toString() ?? "",
    enquiry_date: deal.enquiry_date ?? "",
    enquiry_source: deal.enquiry_source ?? "",
    requirements: deal.requirements ?? "",
    contact_email: deal.contact_email ?? "",
    contact_phone: deal.contact_phone ?? "",
    unit_size_sqm: deal.unit_size_sqm?.toString() ?? "",
    rate_per_sqm: deal.rate_per_sqm?.toString() ?? "",
    lease_term_months: deal.lease_term_months?.toString() ?? "",
    commencement_date: deal.commencement_date ?? "",
    notes: deal.notes ?? "",
  };
}

export function LeasingDealFormButton({
  deal,
  label,
  buildings,
  tenants,
  vacantUnits,
  defaultBuildingId,
}: {
  deal?: Deal;
  label: string;
  buildings: { id: string; name: string }[];
  tenants: { id: string; trading_name: string }[];
  vacantUnits?: { id: string; building_id: string; shop_number: string | null }[];
  defaultBuildingId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LeasingDealInput>(toInput(deal, defaultBuildingId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof LeasingDealInput>(key: K, value: LeasingDealInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function openModal() {
    setValues(toInput(deal, defaultBuildingId));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = deal ? await updateLeasingDeal(deal.id, values) : await createLeasingDeal(values);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    if (!deal && "id" in result && result.id) {
      router.push(`/dashboard/leasing/${result.id}`);
    } else {
      router.refresh();
    }
  }

  const unitsForBuilding = (vacantUnits ?? []).filter((u) => u.building_id === values.building_id);

  return (
    <>
      <button onClick={openModal} className={deal ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={deal ? "Edit Deal" : "Log Leasing Enquiry"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <label className="label">Vacant Unit (optional)</label>
                <select
                  className="input"
                  value={values.vacant_unit_id}
                  onChange={(e) => set("vacant_unit_id", e.target.value)}
                >
                  <option value="">None</option>
                  {unitsForBuilding.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.shop_number ?? "Unit"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Prospect Name</label>
                <input
                  className="input"
                  value={values.prospect_name}
                  onChange={(e) => set("prospect_name", e.target.value)}
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Contact Email</label>
                <input
                  type="email"
                  className="input"
                  value={values.contact_email}
                  onChange={(e) => set("contact_email", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Contact Phone</label>
                <input
                  className="input"
                  value={values.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Enquiry Date</label>
                <input
                  type="date"
                  className="input"
                  value={values.enquiry_date}
                  onChange={(e) => set("enquiry_date", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Enquiry Source</label>
                <input
                  className="input"
                  placeholder="e.g. Signage, referral, website"
                  value={values.enquiry_source}
                  onChange={(e) => set("enquiry_source", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Requirements</label>
              <textarea
                rows={2}
                className="input"
                placeholder="Space required, trading hours, fit-out needs..."
                value={values.requirements}
                onChange={(e) => set("requirements", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Existing Tenant (optional, for renewals)</label>
              <select className="input" value={values.tenant_id} onChange={(e) => set("tenant_id", e.target.value)}>
                <option value="">None</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.trading_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stage</label>
                <select className="input" value={values.stage} onChange={(e) => set("stage", e.target.value)}>
                  {STAGE_OPTIONS.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Deal Value</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.deal_value}
                  onChange={(e) => set("deal_value", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Unit Size (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.unit_size_sqm}
                  onChange={(e) => set("unit_size_sqm", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Rate / m²</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.rate_per_sqm}
                  onChange={(e) => set("rate_per_sqm", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Term (months)</label>
                <input
                  type="number"
                  className="input"
                  value={values.lease_term_months}
                  onChange={(e) => set("lease_term_months", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Commencement Date</label>
              <input
                type="date"
                className="input"
                value={values.commencement_date}
                onChange={(e) => set("commencement_date", e.target.value)}
              />
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
