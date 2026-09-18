"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createBuilding, updateBuilding, type BuildingInput } from "./actions";

type Building = {
  id: string;
  name: string;
  address: string | null;
  gla: number | null;
  budget: number | null;
  portfolio: string | null;
  notes: string | null;
};

const EMPTY: BuildingInput = {
  name: "",
  address: "",
  gla: "",
  budget: "",
  portfolio: "",
  notes: "",
};

function toInput(building?: Building | null): BuildingInput {
  if (!building) return EMPTY;
  return {
    name: building.name ?? "",
    address: building.address ?? "",
    gla: building.gla?.toString() ?? "",
    budget: building.budget?.toString() ?? "",
    portfolio: building.portfolio ?? "",
    notes: building.notes ?? "",
  };
}

export function BuildingFormButton({
  building,
  label,
}: {
  building?: Building;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<BuildingInput>(toInput(building));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(building));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = building
      ? await updateBuilding(building.id, values)
      : await createBuilding(values);

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
        className={building ? "btn-secondary" : "btn-primary"}
      >
        {label}
      </button>

      {open && (
        <Modal title={building ? "Edit Building" : "Add Building"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                required
                className="input"
                value={values.name}
                onChange={(e) => setValues({ ...values, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Address</label>
              <input
                className="input"
                value={values.address}
                onChange={(e) => setValues({ ...values, address: e.target.value })}
              />
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
                <label className="label">Budget</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.budget}
                  onChange={(e) => setValues({ ...values, budget: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Portfolio</label>
              <input
                className="input"
                value={values.portfolio}
                onChange={(e) => setValues({ ...values, portfolio: e.target.value })}
              />
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
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpen(false)}
              >
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
