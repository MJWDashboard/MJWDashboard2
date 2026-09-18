"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createApprovedRate, updateApprovedRate, type ApprovedRateInput } from "./actions";

type ApprovedRate = {
  id: string;
  building_id: string;
  category: string;
  rate_per_sqm: number;
  effective_date: string | null;
  notes: string | null;
};

const EMPTY: ApprovedRateInput = {
  building_id: "",
  category: "",
  rate_per_sqm: "",
  effective_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

function toInput(rate?: ApprovedRate | null, defaultBuildingId?: string): ApprovedRateInput {
  if (!rate) return { ...EMPTY, building_id: defaultBuildingId ?? "" };
  return {
    building_id: rate.building_id,
    category: rate.category,
    rate_per_sqm: rate.rate_per_sqm.toString(),
    effective_date: rate.effective_date ?? "",
    notes: rate.notes ?? "",
  };
}

export function ApprovedRateFormButton({
  rate,
  label,
  buildings,
  defaultBuildingId,
}: {
  rate?: ApprovedRate;
  label: string;
  buildings: { id: string; name: string }[];
  defaultBuildingId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ApprovedRateInput>(toInput(rate, defaultBuildingId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof ApprovedRateInput>(key: K, value: ApprovedRateInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function openModal() {
    setValues(toInput(rate, defaultBuildingId));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = rate ? await updateApprovedRate(rate.id, values) : await createApprovedRate(values);
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
      <button onClick={openModal} className={rate ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={rate ? "Edit Approved Rate" : "Add Approved Rate"} onClose={() => setOpen(false)}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Retail, Anchor, Kiosk"
                  value={values.category}
                  onChange={(e) => set("category", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Approved Rate / m²</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.rate_per_sqm}
                  onChange={(e) => set("rate_per_sqm", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Effective Date</label>
              <input
                type="date"
                className="input"
                value={values.effective_date}
                onChange={(e) => set("effective_date", e.target.value)}
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
