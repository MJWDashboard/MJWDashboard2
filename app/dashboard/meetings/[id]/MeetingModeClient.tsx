"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRightCircle } from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/format";
import { Badge } from "@/components/StatusBadge";
import { RISK_SEVERITY_CLASSES, enumLabel } from "@/lib/status";
import { addMeetingNote, convertNoteToAction, addMeetingAction, addMeetingRisk } from "../actions";

type Note = {
  id: string;
  note: string;
  category: string;
  tenant_id: string | null;
  converted_to_action_id: string | null;
  created_at: string;
  tenants: { trading_name: string } | null;
};

type Risk = {
  id: string;
  description: string;
  severity: string;
  mitigation: string | null;
  deadline: string | null;
  escalation_flag: boolean;
  status: string;
};

type ActionItem = {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  status: string;
};

const TABS = ["Notes", "Decisions", "Risks", "Actions"] as const;
type Tab = (typeof TABS)[number];

export function MeetingModeClient({
  meetingId,
  buildingId,
  tenants,
  initialNotes,
  initialRisks,
  initialActions,
}: {
  meetingId: string;
  buildingId: string | null;
  tenants: { id: string; trading_name: string }[];
  initialNotes: Note[];
  initialRisks: Risk[];
  initialActions: ActionItem[];
}) {
  const [tab, setTab] = useState<Tab>("Notes");
  const notes = initialNotes.filter((n) => n.category === "note");
  const decisions = initialNotes.filter((n) => n.category === "decision");

  return (
    <div className="card">
      <div className="mb-4 flex gap-1 border-b border-charcoal-700">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-md px-3 py-2 text-sm transition-colors ${
              tab === t ? "border-b-2 border-cyan-500 text-cyan-400" : "text-charcoal-300 hover:text-charcoal-100"
            }`}
          >
            {t}
            {t === "Risks" && initialRisks.length > 0 ? ` (${initialRisks.length})` : ""}
            {t === "Actions" && initialActions.length > 0 ? ` (${initialActions.length})` : ""}
          </button>
        ))}
      </div>

      {(tab === "Notes" || tab === "Decisions") && (
        <NotesPanel
          meetingId={meetingId}
          buildingId={buildingId}
          tenants={tenants}
          items={tab === "Notes" ? notes : decisions}
          category={tab === "Notes" ? "note" : "decision"}
        />
      )}

      {tab === "Risks" && (
        <RisksPanel meetingId={meetingId} buildingId={buildingId} tenants={tenants} risks={initialRisks} />
      )}

      {tab === "Actions" && (
        <ActionsPanel meetingId={meetingId} buildingId={buildingId} tenants={tenants} actions={initialActions} />
      )}
    </div>
  );
}

function NotesPanel({
  meetingId,
  buildingId,
  tenants,
  items,
  category,
}: {
  meetingId: string;
  buildingId: string | null;
  tenants: { id: string; trading_name: string }[];
  items: Note[];
  category: "note" | "decision";
}) {
  const [text, setText] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const result = await addMeetingNote(meetingId, tenantId || null, text, category);
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
    <div>
      <form onSubmit={handleAdd} className="mb-5 space-y-3 border-b border-charcoal-700 pb-5">
        <textarea
          rows={3}
          placeholder={category === "note" ? "Capture a note from the meeting…" : "Capture a decision made…"}
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
            {saving ? "Saving…" : category === "note" ? "Add Note" : "Add Decision"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {items.length === 0 && <p className="text-sm text-charcoal-400">Nothing captured yet.</p>}
        {items.map((n) => (
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

function RisksPanel({
  meetingId,
  buildingId,
  tenants,
  risks,
}: {
  meetingId: string;
  buildingId: string | null;
  tenants: { id: string; trading_name: string }[];
  risks: Risk[];
}) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [tenantId, setTenantId] = useState("");
  const [mitigation, setMitigation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [escalate, setEscalate] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSaving(true);
    await addMeetingRisk({
      meeting_id: meetingId,
      building_id: buildingId,
      tenant_id: tenantId || null,
      description,
      severity,
      mitigation,
      deadline,
      escalation_flag: escalate,
    });
    setSaving(false);
    setDescription("");
    setMitigation("");
    setDeadline("");
    setEscalate(false);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-5 space-y-3 border-b border-charcoal-700 pb-5">
        <textarea
          rows={2}
          placeholder="Describe the risk…"
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-3">
          <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select className="input" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">No tenant tag</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.trading_name}
              </option>
            ))}
          </select>
          <input type="date" className="input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <input
          className="input"
          placeholder="Mitigation plan"
          value={mitigation}
          onChange={(e) => setMitigation(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-charcoal-300">
          <input type="checkbox" checked={escalate} onChange={(e) => setEscalate(e.target.checked)} />
          Escalate
        </label>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Add Risk"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {risks.length === 0 && <p className="text-sm text-charcoal-400">No risks captured yet.</p>}
        {risks.map((r) => (
          <div key={r.id} className="text-sm">
            <div className="mb-1 flex items-center gap-2">
              <Badge label={enumLabel(r.severity)} className={RISK_SEVERITY_CLASSES[r.severity] ?? ""} />
              {r.escalation_flag && <Badge label="Escalated" className="bg-red-500/20 text-red-400" />}
              {r.deadline && <span className="text-xs text-charcoal-400">Due {formatDate(r.deadline)}</span>}
            </div>
            <p className="text-charcoal-100">{r.description}</p>
            {r.mitigation && <p className="text-xs text-charcoal-400">Mitigation: {r.mitigation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionsPanel({
  meetingId,
  buildingId,
  tenants,
  actions,
}: {
  meetingId: string;
  buildingId: string | null;
  tenants: { id: string; trading_name: string }[];
  actions: ActionItem[];
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [tenantId, setTenantId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await addMeetingAction({
      meeting_id: meetingId,
      building_id: buildingId,
      tenant_id: tenantId || null,
      title,
      priority,
      due_date: dueDate,
    });
    setSaving(false);
    setTitle("");
    setDueDate("");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="mb-5 space-y-3 border-b border-charcoal-700 pb-5">
        <input
          className="input"
          placeholder="Action item…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-3">
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select className="input" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">No tenant tag</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.trading_name}
              </option>
            ))}
          </select>
          <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Add Action"}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {actions.length === 0 && <p className="text-sm text-charcoal-400">No action items yet.</p>}
        {actions.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-sm">
            <span>{a.title}</span>
            <Badge label={enumLabel(a.priority)} className="bg-charcoal-600/60 text-charcoal-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
