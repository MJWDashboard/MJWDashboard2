"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { Badge } from "@/components/StatusBadge";
import {
  createServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
  type ServiceProviderInput,
} from "../actions";
import { SERVICE_TYPE_OPTIONS, SERVICE_TYPE_LABEL } from "../serviceProviderTypes";

export type ServiceProvider = {
  id: string;
  service_type: string;
  provider_name: string;
  site_senior: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  hours_on_site: string | null;
  notes: string | null;
};

function ProviderForm({
  buildingId,
  initial,
  onDone,
}: {
  buildingId: string;
  initial: ServiceProvider | null;
  onDone: () => void;
}) {
  const [serviceType, setServiceType] = useState(initial?.service_type ?? "cleaning");
  const [providerName, setProviderName] = useState(initial?.provider_name ?? "");
  const [siteSenior, setSiteSenior] = useState(initial?.site_senior ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [hoursOnSite, setHoursOnSite] = useState(initial?.hours_on_site ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input: ServiceProviderInput = {
      buildingId,
      serviceType,
      providerName,
      siteSenior,
      contactPhone,
      contactEmail,
      hoursOnSite,
      notes,
    };
    const result = initial
      ? await updateServiceProvider(initial.id, input)
      : await createServiceProvider(input);

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Service Type</label>
          <select className="input" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
            {SERVICE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Provider / Company Name</label>
          <input required className="input" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Site Senior / Supervisor</label>
          <input className="input" value={siteSenior} onChange={(e) => setSiteSenior(e.target.value)} />
        </div>
        <div>
          <label className="label">Hours on Site</label>
          <input
            className="input"
            placeholder="e.g. Mon-Fri 06:00-18:00"
            value={hoursOnSite}
            onChange={(e) => setHoursOnSite(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Contact Phone</label>
          <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Contact Email</label>
          <input type="email" className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Saving…" : initial ? "Save Changes" : "Add Provider"}
        </button>
      </div>
    </form>
  );
}

export function ServiceProviders({ buildingId, providers }: { buildingId: string; providers: ServiceProvider[] }) {
  const [modal, setModal] = useState<"add" | ServiceProvider | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Remove this service provider?")) return;
    setBusyId(id);
    await deleteServiceProvider(id, buildingId);
    setBusyId(null);
    router.refresh();
  }

  return (
    <section className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Service Providers</h2>
        <button onClick={() => setModal("add")} className="text-xs text-cyan-400 hover:underline">
          + Add Provider
        </button>
      </div>
      {providers.length > 0 ? (
        <div className="space-y-3">
          {providers.map((p) => (
            <div key={p.id} className="rounded-md border border-charcoal-700 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge label={SERVICE_TYPE_LABEL[p.service_type] ?? p.service_type} className="bg-charcoal-600/60 text-charcoal-200" />
                  <span className="font-medium text-charcoal-100">{p.provider_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setModal(p)} className="text-xs text-cyan-400 hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={busyId === p.id}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-charcoal-400 sm:grid-cols-2">
                {p.site_senior && <span>Site Senior: {p.site_senior}</span>}
                {p.hours_on_site && <span>Hours: {p.hours_on_site}</span>}
                {p.contact_phone && <span>Phone: {p.contact_phone}</span>}
                {p.contact_email && <span>Email: {p.contact_email}</span>}
              </div>
              {p.notes && <p className="mt-1 text-xs text-charcoal-400">{p.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-charcoal-400">No service providers recorded for this building.</p>
      )}

      {modal && (
        <Modal
          title={modal === "add" ? "Add Service Provider" : "Edit Service Provider"}
          onClose={() => setModal(null)}
        >
          <ProviderForm
            buildingId={buildingId}
            initial={modal === "add" ? null : modal}
            onDone={() => setModal(null)}
          />
        </Modal>
      )}
    </section>
  );
}
