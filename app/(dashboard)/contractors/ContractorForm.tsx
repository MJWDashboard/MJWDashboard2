"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createContractor, updateContractor, type ContractorInput } from "./actions";

type Contractor = {
  id: string;
  contact_id: string | null;
  trade: string | null;
  building_id: string | null;
  rating: number | null;
  notes: string | null;
};

const EMPTY: ContractorInput = { contact_id: "", trade: "", building_id: "", rating: "", notes: "" };

function toInput(c?: Contractor | null): ContractorInput {
  if (!c) return EMPTY;
  return {
    contact_id: c.contact_id ?? "",
    trade: c.trade ?? "",
    building_id: c.building_id ?? "",
    rating: c.rating?.toString() ?? "",
    notes: c.notes ?? "",
  };
}

export function ContractorFormButton({
  contractor,
  label,
  contacts,
  buildings,
}: {
  contractor?: Contractor;
  label: string;
  contacts: { id: string; name: string }[];
  buildings: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ContractorInput>(toInput(contractor));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(contractor));
    setError(null);
    setOpen(true);
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
            <div>
              <label className="label">Contact</label>
              <select
                required
                className="input"
                value={values.contact_id}
                onChange={(e) => setValues({ ...values, contact_id: e.target.value })}
              >
                <option value="" disabled>
                  Select a contact
                </option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Trade</label>
                <input
                  className="input"
                  value={values.trade}
                  onChange={(e) => setValues({ ...values, trade: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Rating (1–5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="input"
                  value={values.rating}
                  onChange={(e) => setValues({ ...values, rating: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Building</label>
              <select
                className="input"
                value={values.building_id}
                onChange={(e) => setValues({ ...values, building_id: e.target.value })}
              >
                <option value="">None</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
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
