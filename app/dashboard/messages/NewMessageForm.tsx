"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createTeamMessage } from "./actions";

type Portfolio = { id: string; name: string };
type Building = { id: string; name: string; portfolio_id: string };
type Member = { id: string; user_id: string; portfolio_id: string; role: string };

export function NewMessageButton({
  portfolios,
  buildings,
  members,
  emails,
}: {
  portfolios: Portfolio[];
  buildings: Building[];
  members: Member[];
  emails: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"task" | "message">("task");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id ?? "");
  const [buildingId, setBuildingId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const buildingOptions = useMemo(
    () => buildings.filter((b) => b.portfolio_id === portfolioId),
    [buildings, portfolioId]
  );
  const memberOptions = useMemo(
    () => members.filter((m) => m.portfolio_id === portfolioId),
    [members, portfolioId]
  );

  function reset() {
    setType("task");
    setSubject("");
    setBody("");
    setBuildingId("");
    setAssignedTo("");
    setDueDate("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createTeamMessage({
      type,
      subject,
      body,
      portfolioId,
      buildingId: buildingId || null,
      assignedTo,
      dueDate: dueDate || null,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
    if (result.id) router.push(`/dashboard/messages/${result.id}`);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        + New Task / Message
      </button>
      {open && (
        <Modal title="Assign a Task or Message" onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  type === "task"
                    ? "border-cyan-500 bg-cyan-600/15 text-cyan-400"
                    : "border-charcoal-700 text-charcoal-300"
                }`}
                onClick={() => setType("task")}
              >
                Task
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  type === "message"
                    ? "border-cyan-500 bg-cyan-600/15 text-cyan-400"
                    : "border-charcoal-700 text-charcoal-300"
                }`}
                onClick={() => setType("message")}
              >
                Message
              </button>
            </div>

            <div>
              <label className="label">Portfolio</label>
              <select
                required
                className="input"
                value={portfolioId}
                onChange={(e) => {
                  setPortfolioId(e.target.value);
                  setBuildingId("");
                  setAssignedTo("");
                }}
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Building (optional)</label>
                <select className="input" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
                  <option value="">Whole portfolio</option>
                  {buildingOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Assign to</label>
                <select
                  required
                  className="input"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="" disabled>
                    Select a person
                  </option>
                  {memberOptions.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {emails[m.user_id] ?? m.user_id}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Subject</label>
              <input required className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div>
              <label className="label">Details</label>
              <textarea
                className="input min-h-24"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {type === "task" && (
              <div>
                <label className="label">Due Date (optional)</label>
                <input
                  type="date"
                  className="input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
