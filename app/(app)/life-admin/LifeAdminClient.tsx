"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { ClipboardList, Plus, Trash2, Pencil, X, Check } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { computeUrgency, CATEGORY_LABEL, URGENCY_LABEL, type LifeAdminUrgency } from "@/lib/lifeAdmin";
import { createLifeAdminItem, updateLifeAdminItem, markLifeAdminComplete, deleteLifeAdminItem } from "./actions";

type Item = Tables<"life_admin_items">;

const CATEGORIES = Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[];
const FILTERS = ["Needs attention", "All", "Complete"] as const;

const URGENCY_PILL: Record<LifeAdminUrgency, string> = {
  complete: "status-pill-ok",
  expired: "status-pill-overdue",
  action_required: "status-pill-overdue",
  due_soon: "status-pill-soon",
  current: "status-pill",
};

export function LifeAdminClient({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Needs attention");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [, startTransition] = useTransition();

  const withUrgency = items.map((item) => ({
    item,
    urgency: computeUrgency(item.status, item.due_date, item.lead_days),
  }));

  const filtered = withUrgency.filter(({ urgency }) => {
    if (filter === "Complete") return urgency === "complete";
    if (filter === "All") return true;
    return urgency !== "complete" && urgency !== "current";
  });

  const sorted = [...filtered].sort((a, b) => {
    const rank: Record<LifeAdminUrgency, number> = { expired: 0, action_required: 1, due_soon: 2, current: 3, complete: 4 };
    return rank[a.urgency] - rank[b.urgency] || (a.item.due_date ?? "").localeCompare(b.item.due_date ?? "");
  });

  return (
    <div className="space-y-4">
      <PageHeader icon={ClipboardList} color="#0FAE9C" eyebrow="Life" title="Life Admin" />

      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", filter === f ? "bg-accent text-white" : "border border-border text-muted")}
          >
            {f}
          </button>
        ))}
      </div>

      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add item
      </button>

      {sorted.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nothing here" detail="Track passports, licences, insurance, warranties and other renewals with lead-time alerts." />
      ) : (
        <div className="space-y-2">
          {sorted.map(({ item, urgency }) => (
            <div key={item.id} className="card flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{item.title}</p>
                <p className="text-xs text-muted">
                  {CATEGORY_LABEL[item.category] ?? item.category}
                  {item.due_date && ` · ${new Date(item.due_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={URGENCY_PILL[urgency]}>{URGENCY_LABEL[urgency]}</span>
                <button
                  onClick={() => startTransition(() => markLifeAdminComplete(item.id, urgency !== "complete"))}
                  className={clsx("flex h-6 w-6 items-center justify-center rounded-full border", urgency === "complete" ? "border-ok bg-ok text-white" : "border-border text-muted")}
                  aria-label={urgency === "complete" ? "Reopen" : "Mark complete"}
                >
                  <Check size={13} />
                </button>
                <button onClick={() => setEditing(item)} className="text-muted hover:text-text" aria-label="Edit item">
                  <Pencil size={14} />
                </button>
                <button onClick={() => startTransition(() => deleteLifeAdminItem(item.id))} className="text-muted hover:text-overdue" aria-label="Delete item">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <ItemForm onClose={() => setShowForm(false)} />}
      {editing && <ItemForm item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ItemForm({ item, onClose }: { item?: Item; onClose: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState<string>(item?.category ?? "other");
  const [dueDate, setDueDate] = useState(item?.due_date ?? "");
  const [leadDays, setLeadDays] = useState((item?.lead_days ?? [90, 60, 30, 7]).join(", "));
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!title.trim()) return;
    const parsedLeadDays = leadDays
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);
    const fields = {
      title: title.trim(),
      category,
      due_date: dueDate || null,
      lead_days: parsedLeadDays.length > 0 ? parsedLeadDays : [90, 60, 30, 7],
      notes: notes.trim() || null,
    };
    startTransition(async () => {
      if (item) await updateLifeAdminItem(item.id, fields);
      else await createLifeAdminItem(fields);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{item ? "Edit item" : "New item"}</p>
          <button onClick={onClose} className="text-muted hover:text-text" aria-label="Close"><X size={18} /></button>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Passport renewal)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
        <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <div>
          <input value={leadDays} onChange={(e) => setLeadDays(e.target.value)} placeholder="Alert lead times in days, e.g. 90, 60, 30, 7" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
          <p className="mt-1 text-[11px] text-muted">Comma-separated days before the due date to flag as due soon / needing action.</p>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />

        <div className="flex gap-2">
          {item && (
            <button onClick={() => startTransition(async () => { await deleteLifeAdminItem(item.id); onClose(); })} className="btn-secondary px-3 text-overdue" aria-label="Delete item">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={save} disabled={pending} className="btn-primary flex-1">{item ? "Save changes" : "Save item"}</button>
        </div>
      </div>
    </div>
  );
}
