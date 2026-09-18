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
  attendees: string[] | null;
  agenda: string | null;
  status: string;
};

const EMPTY: MeetingInput = {
  title: "",
  building_id: "",
  meeting_date: "",
  attendees: "",
  agenda: "",
  status: "not_started",
};

function toInput(m?: Meeting | null): MeetingInput {
  if (!m) return EMPTY;
  return {
    title: m.title ?? "",
    building_id: m.building_id ?? "",
    meeting_date: m.meeting_date ? m.meeting_date.slice(0, 16) : "",
    attendees: (m.attendees ?? []).join(", "),
    agenda: m.agenda ?? "",
    status: m.status ?? "not_started",
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
      router.push(`/meetings/${result.id}`);
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
              <label className="label">Status</label>
              <select
                className="input"
                value={values.status}
                onChange={(e) => setValues({ ...values, status: e.target.value })}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_on_feedback">Waiting</option>
                <option value="complete">Complete</option>
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
