"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createLeasingDeal, updateLeasingDeal, type LeasingDealInput } from "./actions";

type Deal = {
  id: string;
  building_id: string;
  tenant_id: string | null;
  prospect_name: string | null;
  shop_number: string | null;
  stage: string;
  deal_value: number | null;
  notes: string | null;
};

const STAGE_OPTIONS = ["enquiry", "offer", "negotiation", "signed", "declined", "withdrawn"];

const EMPTY: LeasingDealInput = {
  building_id: "",
  tenant_id: "",
  prospect_name: "",
  shop_number: "",
  stage: "enquiry",
  deal_value: "",
  notes: "",
};

function toInput(deal?: Deal | null, defaultBuildingId?: string): LeasingDealInput {
  if (!deal) return { ...EMPTY, building_id: defaultBuildingId ?? "" };
  return {
    building_id: deal.building_id,
    tenant_id: deal.tenant_id ?? "",
    prospect_name: deal.prospect_name ?? "",
    shop_number: deal.shop_number ?? "",
    stage: deal.stage ?? "enquiry",
    deal_value: deal.deal_value?.toString() ?? "",
    notes: deal.notes ?? "",
  };
}

export function LeasingDealFormButton({
  deal,
  label,
  buildings,
  tenants,
  defaultBuildingId,
}: {
  deal?: Deal;
  label: string;
  buildings: { id: string; name: string }[];
  tenants: { id: string; trading_name: string }[];
  defaultBuildingId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LeasingDealInput>(toInput(deal, defaultBuildingId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
    router.refresh();
  }

  return (
    <>
      <button onClick={openModal} className={deal ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={deal ? "Edit Deal" : "Add Leasing Deal"} onClose={() => setOpen(false)}>
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
                <label className="label">Prospect Name</label>
                <input
                  className="input"
                  value={values.prospect_name}
                  onChange={(e) => setValues({ ...values, prospect_name: e.target.value })}
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
            <div>
              <label className="label">Existing Tenant (optional)</label>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stage</label>
                <select
                  className="input"
                  value={values.stage}
                  onChange={(e) => setValues({ ...values, stage: e.target.value })}
                >
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
                  onChange={(e) => setValues({ ...values, deal_value: e.target.value })}
                />
              </div>
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
