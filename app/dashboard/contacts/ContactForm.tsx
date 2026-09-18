"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createContact, updateContact, type ContactInput } from "./actions";

type Contact = {
  id: string;
  name: string;
  type: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  building_id: string | null;
  notes: string | null;
};

const TYPE_OPTIONS = ["tenant", "landlord", "contractor", "consultant", "attorney", "internal", "other"];

const EMPTY: ContactInput = {
  name: "",
  type: "other",
  company: "",
  email: "",
  phone: "",
  building_id: "",
  notes: "",
};

function toInput(contact?: Contact | null): ContactInput {
  if (!contact) return EMPTY;
  return {
    name: contact.name ?? "",
    type: contact.type ?? "other",
    company: contact.company ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    building_id: contact.building_id ?? "",
    notes: contact.notes ?? "",
  };
}

export function ContactFormButton({
  contact,
  label,
  buildings,
}: {
  contact?: Contact;
  label: string;
  buildings: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ContactInput>(toInput(contact));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(contact));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = contact ? await updateContact(contact.id, values) : await createContact(values);
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
      <button onClick={openModal} className={contact ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={contact ? "Edit Contact" : "Add Contact"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <label className="label">Type</label>
                <select
                  className="input"
                  value={values.type}
                  onChange={(e) => setValues({ ...values, type: e.target.value })}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t} className="capitalize">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Company</label>
              <input
                className="input"
                value={values.company}
                onChange={(e) => setValues({ ...values, company: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={values.email}
                  onChange={(e) => setValues({ ...values, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={values.phone}
                  onChange={(e) => setValues({ ...values, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Related Building</label>
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
