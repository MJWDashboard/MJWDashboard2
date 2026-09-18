"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createBuilding, updateBuilding, type BuildingInput } from "./actions";

type Building = {
  id: string;
  building_code: string | null;
  name: string;
  address_line_1: string | null;
  address_line_2: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  gla: number | null;
  budget_year: number | null;
  annual_budget: number | null;
  active: boolean;
  portfolio_id: string | null;
  notes: string | null;
};

function emptyInput(defaultPortfolioId?: string): BuildingInput {
  return {
    building_code: "",
    name: "",
    address_line_1: "",
    address_line_2: "",
    suburb: "",
    city: "",
    province: "",
    postal_code: "",
    gla: "",
    budget_year: "",
    annual_budget: "",
    active: true,
    portfolio_id: defaultPortfolioId ?? "",
    notes: "",
  };
}

function toInput(building?: Building | null, defaultPortfolioId?: string): BuildingInput {
  if (!building) return emptyInput(defaultPortfolioId);
  return {
    building_code: building.building_code ?? "",
    name: building.name ?? "",
    address_line_1: building.address_line_1 ?? "",
    address_line_2: building.address_line_2 ?? "",
    suburb: building.suburb ?? "",
    city: building.city ?? "",
    province: building.province ?? "",
    postal_code: building.postal_code ?? "",
    gla: building.gla?.toString() ?? "",
    budget_year: building.budget_year?.toString() ?? "",
    annual_budget: building.annual_budget?.toString() ?? "",
    active: building.active,
    portfolio_id: building.portfolio_id ?? "",
    notes: building.notes ?? "",
  };
}

export function BuildingFormButton({
  building,
  label,
  portfolios,
  defaultPortfolioId,
}: {
  building?: Building;
  label: string;
  portfolios: { id: string; name: string }[];
  defaultPortfolioId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<BuildingInput>(toInput(building, defaultPortfolioId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(building, defaultPortfolioId));
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
        disabled={portfolios.length === 0}
        title={portfolios.length === 0 ? "Ask your administrator to create a portfolio first" : undefined}
      >
        {label}
      </button>

      {open && (
        <Modal title={building ? "Edit Building" : "Add Building"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">Building Code</label>
                <input required className="input uppercase" value={values.building_code} onChange={(e) => setValues({ ...values, building_code: e.target.value })} />
              </div>
              <div>
                <label className="label">Building Name</label>
                <input required className="input" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Address Line 1</label>
              <input
                className="input"
                value={values.address_line_1}
                onChange={(e) => setValues({ ...values, address_line_1: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Address Line 2</label>
              <input
                className="input"
                value={values.address_line_2}
                onChange={(e) => setValues({ ...values, address_line_2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {([['suburb','Suburb'],['city','City'],['province','Province'],['postal_code','Postal Code']] as const).map(([key,label]) => (
                <div key={key}><label className="label">{label}</label><input className="input" value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} /></div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <label className="label">Budget Year</label>
                <input
                  type="number"
                  className="input"
                  value={values.budget_year}
                  onChange={(e) => setValues({ ...values, budget_year: e.target.value })}
                />
              </div>
              <div><label className="label">Annual Budget (R)</label><input type="number" step="0.01" className="input" value={values.annual_budget} onChange={(e) => setValues({ ...values, annual_budget: e.target.value })} /></div>
            </div>
            <div>
              <label className="label">Portfolio</label>
              <select
                required
                className="input"
                value={values.portfolio_id}
                onChange={(e) => setValues({ ...values, portfolio_id: e.target.value })}
              >
                <option value="" disabled>
                  Select a portfolio
                </option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal-200"><input type="checkbox" checked={values.active} onChange={(e) => setValues({ ...values, active: e.target.checked })} />Active</label>
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
