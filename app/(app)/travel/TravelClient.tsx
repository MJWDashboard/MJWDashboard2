"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, X, Check, Plane, Calendar } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatZAR } from "@/lib/money";
import { createTrip, updateTrip, deleteTrip, createTripItem, toggleTripItem, deleteTripItem } from "./actions";

type Trip = Tables<"travel_trips">;
type Item = Tables<"travel_items">;

const STATUSES = ["planned", "booked", "in_progress", "complete", "cancelled"] as const;
const KINDS = ["booking", "itinerary", "checklist", "document", "expense"] as const;
const VIEWS = ["Upcoming", "Past", "All"] as const;

export function TravelClient({ trips, items }: { trips: Trip[]; items: Item[] }) {
  const [view, setView] = useState<(typeof VIEWS)[number]>("Upcoming");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);

  const filtered = trips.filter((t) => {
    if (view === "All") return true;
    if (view === "Past") return t.status === "complete" || t.status === "cancelled";
    return t.status !== "complete" && t.status !== "cancelled";
  });

  return (
    <div className="space-y-4">
      <PageHeader icon={Plane} color="#0FAE9C" eyebrow="Life" title="Travel" />

      <div className="flex gap-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx("rounded-full px-3 py-1.5 text-xs font-medium", view === v ? "bg-accent text-white" : "border border-border text-muted")}
          >
            {v}
          </button>
        ))}
      </div>

      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add trip
      </button>

      {filtered.length === 0 ? (
        <EmptyState icon={Plane} title="No trips here" detail="Plan a trip with dates and a budget — bookings, itinerary and documents live alongside it." />
      ) : (
        <div className="space-y-2">
          {filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              items={items.filter((i) => i.trip_id === trip.id)}
              onEdit={() => setEditing(trip)}
            />
          ))}
        </div>
      )}

      {showForm && <TripForm onClose={() => setShowForm(false)} />}
      {editing && <TripForm trip={editing} items={items.filter((i) => i.trip_id === editing.id)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TripCard({ trip, items, onEdit }: { trip: Trip; items: Item[]; onEdit: () => void }) {
  const done = items.filter((i) => i.done).length;
  const expenses = items.filter((i) => i.kind === "expense").reduce((sum, i) => sum + Number(i.cost ?? 0), 0);
  return (
    <button onClick={onEdit} className="card block w-full space-y-2 text-left">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">{trip.destination}</p>
        <span className="status-pill capitalize">{trip.status.replace("_", " ")}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {trip.start_date && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(trip.start_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
            {trip.end_date && ` – ${new Date(trip.end_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`}
          </span>
        )}
        {items.length > 0 && <span>{done}/{items.length} items done</span>}
        {trip.budget != null && (
          <span data-sensitive className="tabular">
            {formatZAR(expenses)} / {formatZAR(Number(trip.budget))} budget
          </span>
        )}
      </div>
    </button>
  );
}

function TripForm({ trip, items = [], onClose }: { trip?: Trip; items?: Item[]; onClose: () => void }) {
  const [destination, setDestination] = useState(trip?.destination ?? "");
  const [startDate, setStartDate] = useState(trip?.start_date ?? "");
  const [endDate, setEndDate] = useState(trip?.end_date ?? "");
  const [budget, setBudget] = useState(trip?.budget?.toString() ?? "");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>((trip?.status as (typeof STATUSES)[number]) ?? "planned");
  const [notes, setNotes] = useState(trip?.notes ?? "");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemKind, setNewItemKind] = useState<(typeof KINDS)[number]>("checklist");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!destination.trim()) return;
    const fields = {
      destination: destination.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      budget: budget ? Number(budget) : null,
      status,
      notes: notes.trim() || null,
    };
    startTransition(async () => {
      if (trip) await updateTrip(trip.id, fields);
      else await createTrip(fields);
      onClose();
    });
  }

  function addItem() {
    if (!trip || !newItemTitle.trim()) return;
    startTransition(async () => {
      await createTripItem({ trip_id: trip.id, kind: newItemKind, title: newItemTitle.trim(), detail: null, cost: null });
      setNewItemTitle("");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{trip ? "Edit trip" : "New trip"}</p>
          <button onClick={onClose} className="text-muted hover:text-text" aria-label="Close"><X size={18} /></button>
        </div>

        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <div className="flex gap-2">
          <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
          <input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        </div>
        <div className="flex gap-2">
          <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" placeholder="Budget" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
          <select value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])} className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />

        {trip && (
          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Bookings, itinerary & checklist</p>
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-2">
                <button
                  onClick={() => startTransition(() => toggleTripItem(i.id, !i.done))}
                  className={clsx("flex h-5 w-5 items-center justify-center rounded-full border", i.done ? "border-ok bg-ok text-white" : "border-border")}
                  aria-label={i.done ? "Mark item not done" : "Mark item done"}
                >
                  {i.done && <Check size={12} />}
                </button>
                <span className={clsx("flex-1 text-sm", i.done ? "text-muted line-through" : "text-text")}>
                  {i.title} <span className="text-[10px] uppercase text-muted">{i.kind}</span>
                </span>
                {i.cost != null && <span data-sensitive className="tabular text-xs text-muted">{formatZAR(Number(i.cost))}</span>}
                <button onClick={() => startTransition(() => deleteTripItem(i.id))} className="text-muted hover:text-overdue" aria-label="Delete item">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <select value={newItemKind} onChange={(e) => setNewItemKind(e.target.value as (typeof KINDS)[number])} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text">
                {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Add item" className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-text outline-none focus:border-accent" />
              <button onClick={addItem} className="btn-secondary px-2" aria-label="Add item"><Plus size={14} /></button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {trip && (
            <button onClick={() => startTransition(async () => { await deleteTrip(trip.id); onClose(); })} className="btn-secondary px-3 text-overdue" aria-label="Delete trip">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={save} disabled={pending} className="btn-primary flex-1">{trip ? "Save changes" : "Save trip"}</button>
        </div>
      </div>
    </div>
  );
}
