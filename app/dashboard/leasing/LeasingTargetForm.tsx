"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createLeasingTarget, updateLeasingTarget, type LeasingTargetInput } from "./actions";

type Target = {
  id: string;
  building_id: string;
  company_name: string;
  trade_category: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  notes: string | null;
};

const STATUS_OPTIONS = ["to_approach", "contacted", "meeting_set", "interested", "not_interested", "converted"];

const EMPTY: LeasingTargetInput = {
  building_id: "",
  company_name: "",
  trade_category: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  status: "to_approach",
  notes: "",
};

function toInput(target?: Target | null, defaultBuildingId?: string): LeasingTargetInput {
  if (!target) return { ...EMPTY, building_id: defaultBuildingId ?? "" };
  return {
    building_id: target.building_id,
    company_name: target.company_name,
    trade_category: target.trade_category ?? "",
    contact_name: target.contact_name ?? "",
    contact_email: target.contact_email ?? "",
    contact_phone: target.contact_phone ?? "",
    status: target.status,
    notes: target.notes ?? "",
  };
}

export function LeasingTargetFormButton({
  target,
  label,
  buildings,
  defaultBuildingId,
}: {
  target?: Target;
  label: string;
  buildings: { id: string; name: string }[];
  defaultBuildingId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LeasingTargetInput>(toInput(target, defaultBuildingId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof LeasingTargetInput>(key: K, value: LeasingTargetInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function openModal() {
    setValues(toInput(target, defaultBuildingId));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = target
      ? await updateLeasingTarget(target.id, values)
      : await createLeasingTarget(values);
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
      <button onClick={openModal} className={target ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={target ? "Edit Target" : "Add Target"} onClose={() => setOpen(false)}>
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
                <label className="label">Company Name</label>
                <input
                  required
                  className="input"
                  value={values.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Trade Category</label>
                <input
                  className="input"
                  value={values.trade_category}
                  onChange={(e) => set("trade_category", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={values.status} onChange={(e) => set("status", e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Contact Name</label>
                <input
                  className="input"
                  value={values.contact_name}
                  onChange={(e) => set("contact_name", e.target.value)}
                />
              </div>
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
            <div>
              <label className="label">Notes / Feedback</label>
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
