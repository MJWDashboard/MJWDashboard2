"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRightCircle } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { addMeetingNote, convertNoteToAction } from "../actions";

type Note = {
  id: string;
  note: string;
  tenant_id: string | null;
  converted_to_action_id: string | null;
  created_at: string;
  tenants: { trading_name: string } | null;
};

export function MeetingModeClient({
  meetingId,
  buildingId,
  tenants,
  initialNotes,
}: {
  meetingId: string;
  buildingId: string | null;
  tenants: { id: string; trading_name: string }[];
  initialNotes: Note[];
}) {
  const notes = initialNotes;
  const [text, setText] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const result = await addMeetingNote(meetingId, tenantId || null, text);
    setSaving(false);
    if (!result.error) {
      setText("");
      router.refresh();
    }
  }

  async function handleConvert(note: Note) {
    const title = note.note.slice(0, 120);
    await convertNoteToAction(note.id, meetingId, buildingId, note.tenant_id, title);
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="mb-4 text-sm font-semibold">Live Notes</h2>

      <form onSubmit={handleAddNote} className="mb-5 space-y-3 border-b border-charcoal-700 pb-5">
        <textarea
          rows={3}
          placeholder="Capture a note from the meeting…"
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <select className="input w-auto" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">No tenant tag</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.trading_name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={saving} className="btn-primary ml-auto">
            {saving ? "Saving…" : "Add Note"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {notes.length === 0 && <p className="text-sm text-charcoal-400">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-4 text-sm">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs text-charcoal-400">{formatDateTime(n.created_at)}</span>
                {n.tenants && (
                  <span className="rounded-full bg-charcoal-700 px-2 py-0.5 text-xs text-charcoal-200">
                    {n.tenants.trading_name}
                  </span>
                )}
              </div>
              <p className="text-charcoal-100">{n.note}</p>
            </div>
            {n.converted_to_action_id ? (
              <span className="flex flex-none items-center gap-1 text-xs text-green-400">
                <CheckCircle2 size={14} />
                Action created
              </span>
            ) : (
              <button
                onClick={() => handleConvert(n)}
                className="flex flex-none items-center gap-1 text-xs text-cyan-400 hover:underline"
              >
                <ArrowRightCircle size={14} />
                Convert to Action
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
