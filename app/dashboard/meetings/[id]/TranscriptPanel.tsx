"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveTranscript } from "../actions";

export function TranscriptPanel({
  meetingId,
  initialTranscript,
  initialSummary,
}: {
  meetingId: string;
  initialTranscript: string | null;
  initialSummary: string | null;
}) {
  const [open, setOpen] = useState(Boolean(initialTranscript || initialSummary));
  const [transcript, setTranscript] = useState(initialTranscript ?? "");
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    await saveTranscript(meetingId, transcript, summary);
    setSaving(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary mb-6">
        + Add Transcript / Summary
      </button>
    );
  }

  return (
    <div className="card mb-6">
      <h2 className="mb-4 text-sm font-semibold">Transcript &amp; Summary</h2>
      <div className="space-y-3">
        <div>
          <label className="label">Summary</label>
          <textarea
            rows={3}
            className="input"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Raw Transcript</label>
          <textarea
            rows={6}
            className="input font-mono text-xs"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Transcript"}
          </button>
        </div>
      </div>
    </div>
  );
}
