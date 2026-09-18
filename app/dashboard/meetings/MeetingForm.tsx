"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createMeeting, updateMeeting, type MeetingInput } from "./actions";

type Meeting = {
  id: string;
  title: string;
  building_id: string | null;
  meeting_date: string;
  location: string | null;
  meeting_type: string | null;
  attendees: string[] | null;
  agenda: string | null;
  pre_meeting_notes: string | null;
  status: string;
};

const MEETING_TYPES = [
  "Routine",
  "Monthly Review",
  "Handover",
  "Tenant Meeting",
  "Maintenance",
  "Project",
  "Emergency",
  "Other",
];

const EMPTY: MeetingInput = {
  title: "",
  building_id: "",
  meeting_date: "",
  location: "",
  meeting_type: "",
  attendees: "",
  agenda: "",
  pre_meeting_notes: "",
  status: "scheduled",
};

function toInput(m?: Meeting | null): MeetingInput {
  if (!m) return EMPTY;
  return {
    title: m.title ?? "",
    building_id: m.building_id ?? "",
    meeting_date: m.meeting_date ? m.meeting_date.slice(0, 16) : "",
    location: m.location ?? "",
    meeting_type: m.meeting_type ?? "",
    attendees: (m.attendees ?? []).join(", "),
    agenda: m.agenda ?? "",
    pre_meeting_notes: m.pre_meeting_notes ?? "",
    status: m.status ?? "scheduled",
  };
}

export function MeetingFormButton({
  meeting,
  label,
  buildings,
  onCreated,
}: {
  meeting?: Meeting;
  label: string;
  buildings: { id: string; name: string }[];
  onCreated?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<MeetingInput>(toInput(meeting));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function openModal() {
    setValues(toInput(meeting));
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (meeting) {
      const result = await updateMeeting(meeting.id, values);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
      return;
    }

    const result = await createMeeting(values);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    if (result.id && onCreated) {
      onCreated(result.id);
    } else if (result.id) {
      router.push(`/dashboard/meetings/${result.id}`);
    }
    router.refresh();
  }

  return (
    <>
      <button onClick={openModal} className={meeting ? "btn-secondary" : "btn-primary"}>
        {label}
      </button>
      {open && (
        <Modal title={meeting ? "Edit Meeting" : "New Meeting"} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                required
                className="input"
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <label className="label">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  className="input"
                  value={values.meeting_date}
                  onChange={(e) => setValues({ ...values, meeting_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Meeting Type</label>
                <select
                  className="input"
                  value={values.meeting_type}
                  onChange={(e) => setValues({ ...values, meeting_type: e.target.value })}
                >
                  <option value="">—</option>
                  {MEETING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input"
                  value={values.location}
                  onChange={(e) => setValues({ ...values, location: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Attendees (comma separated)</label>
              <input
                className="input"
                value={values.attendees}
                onChange={(e) => setValues({ ...values, attendees: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Agenda</label>
              <textarea
                rows={3}
                className="input"
                value={values.agenda}
                onChange={(e) => setValues({ ...values, agenda: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Pre-Meeting Notes</label>
              <textarea
                rows={2}
                className="input"
                value={values.pre_meeting_notes}
                onChange={(e) => setValues({ ...values, pre_meeting_notes: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={values.status}
                onChange={(e) => setValues({ ...values, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="archived">Archived</option>
              </select>
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
