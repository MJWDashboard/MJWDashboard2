"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createVacantUnit, updateVacantUnit, type VacantUnitInput } from "./actions";

type VacantUnit = {
  id: string;
  building_id: string;
  shop_number: string | null;
  size_sqm: number | null;
  asking_rate_per_sqm: number | null;
  availability_date: string | null;
  status: string;
  notes: string | null;
};

const EMPTY: VacantUnitInput = {
  building_id: "",
  shop_number: "",
  size_sqm: "",
  asking_rate_per_sqm: "",
  availability_date: "",
  status: "vacant",
  notes: "",
};

function toInput(unit?: VacantUnit | null, defaultBuildingId?: string): VacantUnitInput {
  if (!unit) return { ...EMPTY, building_id: defaultBuildingId ?? "" };
  return {
    building_id: unit.building_id,
    shop_number: unit.shop_number ?? "",
    size_sqm: unit.size_sqm?.toString() ?? "",
    asking_rate_per_sqm: unit.asking_rate_per_sqm?.toString() ?? "",
    availability_date: unit.availability_date ?? "",
    status: unit.status,
    notes: unit.notes ?? "",
  };
}

export function VacantUnitFormButton({
  unit,
  label,
  buildings,
  defaultBuildingId,
}: {
  unit?: VacantUnit;
  label: string;
  buildings: { id: string; name: string }[];
  defaultBuildingId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<VacantUnitInput>(toInput(unit, defaultBuildingId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof VacantUnitInput>(key: K, value: VacantUnitInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function openModal() {
    setValues(toInput(unit, defaultBuildingId));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = unit ? await updateVacantUnit(unit.id, values) : await createVacantUnit(values);
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
      <button onClick={openModal} className={unit ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={unit ? "Edit Vacant Unit" : "Add Vacant Unit"} onClose={() => setOpen(false)}>
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
                <label className="label">Size (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.size_sqm}
                  onChange={(e) => set("size_sqm", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Asking Rate / m²</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.asking_rate_per_sqm}
                  onChange={(e) => set("asking_rate_per_sqm", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Available From</label>
                <input
                  type="date"
                  className="input"
                  value={values.availability_date}
                  onChange={(e) => set("availability_date", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="vacant">Vacant</option>
                  <option value="under_offer">Under Offer</option>
                  <option value="leased">Leased</option>
                </select>
              </div>
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
