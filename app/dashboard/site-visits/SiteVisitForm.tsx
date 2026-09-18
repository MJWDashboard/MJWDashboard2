"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createSiteVisit, updateSiteVisit, type SiteVisitInput } from "./actions";

type SiteVisit = {
  id: string;
  building_id: string;
  visit_date: string;
  start_time: string | null;
  visit_type: string | null;
  attendees: string | null;
  weather: string | null;
  observations: string | null;
  risks: string | null;
  status: string;
};

const VISIT_TYPES = [
  "Routine Inspection",
  "Monthly Inspection",
  "Handover",
  "Tenant Inspection",
  "Maintenance Inspection",
  "Project Inspection",
  "Emergency Inspection",
  "Other",
];

const EMPTY: SiteVisitInput = {
  building_id: "",
  visit_date: "",
  start_time: "",
  visit_type: "",
  attendees: "",
  weather: "",
  observations: "",
  risks: "",
  status: "not_started",
};

function toInput(v?: SiteVisit | null, defaultBuildingId?: string): SiteVisitInput {
  if (!v) return { ...EMPTY, building_id: defaultBuildingId ?? "" };
  return {
    building_id: v.building_id,
    visit_date: v.visit_date,
    start_time: v.start_time ?? "",
    visit_type: v.visit_type ?? "",
    attendees: v.attendees ?? "",
    weather: v.weather ?? "",
    observations: v.observations ?? "",
    risks: v.risks ?? "",
    status: v.status ?? "not_started",
  };
}

export function SiteVisitFormButton({
  visit,
  label,
  buildings,
  defaultBuildingId,
}: {
  visit?: SiteVisit;
  label: string;
  buildings: { id: string; name: string }[];
  defaultBuildingId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<SiteVisitInput>(toInput(visit, defaultBuildingId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(visit, defaultBuildingId));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (visit) {
      const result = await updateSiteVisit(visit.id, values);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
      return;
    }

    const result = await createSiteVisit(values);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    if (result.id) router.push(`/dashboard/site-visits/${result.id}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={openModal} className={visit ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={visit ? "Edit Site Visit" : "Log Site Visit"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="label">Visit Type</label>
                <select
                  className="input"
                  value={values.visit_type}
                  onChange={(e) => setValues({ ...values, visit_type: e.target.value })}
                >
                  <option value="">—</option>
                  {VISIT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Visit Date</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={values.visit_date}
                  onChange={(e) => setValues({ ...values, visit_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Time</label>
                <input
                  type="time"
                  className="input"
                  value={values.start_time}
                  onChange={(e) => setValues({ ...values, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Weather</label>
                <input
                  className="input"
                  value={values.weather}
                  onChange={(e) => setValues({ ...values, weather: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Attendees</label>
              <input
                className="input"
                placeholder="Comma separated"
                value={values.attendees}
                onChange={(e) => setValues({ ...values, attendees: e.target.value })}
              />
            </div>
            <div>
              <label className="label">General Notes</label>
              <textarea
                rows={2}
                className="input"
                value={values.observations}
                onChange={(e) => setValues({ ...values, observations: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={values.status}
                onChange={(e) => setValues({ ...values, status: e.target.value })}
              >
                <option value="not_started">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_on_feedback">Waiting</option>
                <option value="complete">Completed</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Saving…" : visit ? "Save" : "Start Visit"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
