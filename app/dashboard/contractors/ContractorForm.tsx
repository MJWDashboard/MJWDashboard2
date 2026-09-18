"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createContractor, updateContractor, type ContractorInput } from "./actions";

type Contractor = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  trade: string | null;
  email: string | null;
  phone: string | null;
  alt_phone: string | null;
  vat_number: string | null;
  registration_number: string | null;
  rating: number | null;
  standard_rate: number | null;
  notes: string | null;
  buildingIds: string[];
};

const EMPTY: ContractorInput = {
  company_name: "",
  contact_name: "",
  trade: "",
  email: "",
  phone: "",
  alt_phone: "",
  vat_number: "",
  registration_number: "",
  rating: "",
  standard_rate: "",
  notes: "",
  building_ids: [],
};

function toInput(c?: Contractor | null): ContractorInput {
  if (!c) return EMPTY;
  return {
    company_name: c.company_name ?? "",
    contact_name: c.contact_name ?? "",
    trade: c.trade ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    alt_phone: c.alt_phone ?? "",
    vat_number: c.vat_number ?? "",
    registration_number: c.registration_number ?? "",
    rating: c.rating?.toString() ?? "",
    standard_rate: c.standard_rate?.toString() ?? "",
    notes: c.notes ?? "",
    building_ids: c.buildingIds,
  };
}

export function ContractorFormButton({
  contractor,
  label,
  buildings,
}: {
  contractor?: Contractor;
  label: string;
  buildings: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ContractorInput>(toInput(contractor));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof ContractorInput>(key: K, value: ContractorInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function openModal() {
    setValues(toInput(contractor));
    setError(null);
    setOpen(true);
  }

  function toggleBuilding(id: string) {
    set(
      "building_ids",
      values.building_ids.includes(id)
        ? values.building_ids.filter((b) => b !== id)
        : [...values.building_ids, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = contractor
      ? await updateContractor(contractor.id, values)
      : await createContractor(values);
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
      <button onClick={openModal} className={contractor ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={contractor ? "Edit Contractor" : "Add Contractor"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Company Name</label>
                <input
                  className="input"
                  value={values.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Contact Name</label>
                <input
                  className="input"
                  value={values.contact_name}
                  onChange={(e) => set("contact_name", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Trade</label>
                <input className="input" value={values.trade} onChange={(e) => set("trade", e.target.value)} />
              </div>
              <div>
                <label className="label">Rating (1–5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="input"
                  value={values.rating}
                  onChange={(e) => set("rating", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Alt Phone</label>
                <input
                  className="input"
                  value={values.alt_phone}
                  onChange={(e) => set("alt_phone", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Standard Rate</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={values.standard_rate}
                  onChange={(e) => set("standard_rate", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">VAT Number</label>
                <input
                  className="input"
                  value={values.vat_number}
                  onChange={(e) => set("vat_number", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Registration Number</label>
                <input
                  className="input"
                  value={values.registration_number}
                  onChange={(e) => set("registration_number", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Buildings Serviced</label>
              <div className="max-h-32 overflow-y-auto rounded-md border border-charcoal-700 p-2">
                {buildings.map((b) => (
                  <label key={b.id} className="flex items-center gap-2 py-0.5 text-sm text-charcoal-200">
                    <input
                      type="checkbox"
                      checked={values.building_ids.includes(b.id)}
                      onChange={() => toggleBuilding(b.id)}
                    />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea rows={3} className="input" value={values.notes} onChange={(e) => set("notes", e.target.value)} />
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
