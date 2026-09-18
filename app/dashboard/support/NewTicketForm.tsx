"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createSupportTicket } from "./actions";
import { TICKET_CATEGORY_OPTIONS, TICKET_PRIORITY_OPTIONS } from "./roles";
import type { TicketCategory, TicketPriority } from "./actions";

type Building = { id: string; name: string };

export function NewTicketButton({ buildings }: { buildings: Building[] }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>("fault");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function reset() {
    setCategory("fault");
    setSubject("");
    setDescription("");
    setBuildingId("");
    setPriority("medium");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createSupportTicket({
      category,
      subject,
      description,
      buildingId: buildingId || null,
      priority,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
    if (result.id) router.push(`/dashboard/support/${result.id}`);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Report a Fault / Log a Ticket
      </button>
      {open && (
        <Modal title="Report a Fault or Issue" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                >
                  {TICKET_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                >
                  {TICKET_PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Building (optional)</label>
              <select className="input" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
                <option value="">Not building-specific</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Subject</label>
              <input required className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div>
              <label className="label">Details</label>
              <textarea
                className="input min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Steps to reproduce, when it started, etc."
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Logging…" : "Log Ticket"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
