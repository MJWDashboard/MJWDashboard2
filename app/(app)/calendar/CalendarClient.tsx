"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { CalendarDays, Car, Plus, Trash2, X, RefreshCw, Unlink } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import { nextOccurrence, daysUntil } from "@/lib/recurrence";
import {
  createEvent,
  deleteEvent,
  toggleTransportConfirmed,
  createImportantDate,
  deleteImportantDate,
  syncGoogleNow,
  disconnectGoogleAccount,
} from "./actions";

type EventRow = Tables<"events">;
type ImportantDate = Tables<"important_dates">;
type GoogleAccount = Tables<"google_accounts">;

type AgendaEntry =
  | { kind: "event"; date: Date; event: EventRow }
  | { kind: "important"; date: Date; important: ImportantDate };

export function CalendarClient({
  initialEvents,
  initialImportantDates,
  googleAccount,
}: {
  initialEvents: EventRow[];
  initialImportantDates: ImportantDate[];
  googleAccount: GoogleAccount | null;
}) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [showDateForm, setShowDateForm] = useState(false);

  const agenda = useMemo<AgendaEntry[]>(() => {
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 60);

    const eventEntries: AgendaEntry[] = initialEvents
      .map((e) => ({ kind: "event" as const, date: new Date(e.starts_at), event: e }))
      .filter((e) => e.date >= now && e.date <= horizon);

    const importantEntries: AgendaEntry[] = initialImportantDates.map((d) => ({
      kind: "important" as const,
      date: nextOccurrence(d.recurrence as "yearly" | "monthly", d.month, d.day),
      important: d,
    }));

    return [...eventEntries, ...importantEntries].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [initialEvents, initialImportantDates]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader
          icon={CalendarDays}
          color={NAV_ITEMS.find((n) => n.href === "/calendar")!.color}
          eyebrow="Calendar & Dates"
          title="Agenda"
        />
        <div className="flex gap-2">
          <button onClick={() => setShowDateForm(true)} className="btn-secondary px-3 py-1.5 text-xs">
            Recurring date
          </button>
          <button onClick={() => setShowEventForm(true)} className="btn-primary px-3 py-1.5 text-xs">
            <Plus size={14} /> Event
          </button>
        </div>
      </div>

      <GoogleSyncCard googleAccount={googleAccount} />

      {agenda.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing coming up" detail="Add an event or a recurring date to get started." />
      ) : (
        <div className="space-y-2">
          {agenda.map((entry) => (
            <AgendaRow key={entry.kind + (entry.kind === "event" ? entry.event.id : entry.important.id)} entry={entry} />
          ))}
        </div>
      )}

      {showEventForm && <EventForm onClose={() => setShowEventForm(false)} />}
      {showDateForm && <ImportantDateForm onClose={() => setShowDateForm(false)} />}
    </div>
  );
}

function GoogleSyncCard({ googleAccount }: { googleAccount: GoogleAccount | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [syncing, startTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const googleStatus = searchParams.get("google");
  const errorMessage = searchParams.get("message");

  function handleSync() {
    startTransition(async () => {
      const result = await syncGoogleNow();
      setSyncMessage("count" in result ? `Synced ${result.count} events` : result.error);
      router.refresh();
    });
  }

  return (
    <div className="card space-y-2">
      {googleStatus === "connected" && (
        <p className="text-xs text-ok">Google Calendar connected — hit &quot;Sync now&quot; to pull events in.</p>
      )}
      {googleStatus === "error" && (
        <p className="text-xs text-overdue">Couldn&apos;t connect Google Calendar{errorMessage ? `: ${errorMessage}` : ""}.</p>
      )}

      {googleAccount ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text">Google Calendar connected</p>
            <p className="text-xs text-muted">
              {googleAccount.google_email}
              {googleAccount.last_synced_at &&
                ` · last synced ${new Date(googleAccount.last_synced_at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" })}`}
            </p>
            {syncMessage && <p className="text-xs text-muted">{syncMessage}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSync} disabled={syncing} className="btn-secondary px-3 py-1.5 text-xs">
              <RefreshCw size={12} className={syncing ? "animate-spin" : ""} /> {syncing ? "Syncing" : "Sync now"}
            </button>
            <button
              onClick={() => startTransition(() => disconnectGoogleAccount())}
              className="text-muted hover:text-overdue"
              aria-label="Disconnect Google"
            >
              <Unlink size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text">Google Calendar</p>
            <p className="text-xs text-muted">Not connected — pulls events in one-way for now.</p>
          </div>
          <a href="/api/google/connect" className="btn-primary px-3 py-1.5 text-xs">
            Connect
          </a>
        </div>
      )}
    </div>
  );
}

function AgendaRow({ entry }: { entry: AgendaEntry }) {
  const [, startTransition] = useTransition();
  const dateLabel = entry.date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

  if (entry.kind === "event") {
    const e = entry.event;
    const timeLabel = new Date(e.starts_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
    return (
      <div className="card flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted">{dateLabel} · {timeLabel}</p>
          <p className="truncate text-sm font-medium text-text">{e.title}</p>
          {e.location && <p className="text-xs text-muted">{e.location}</p>}
        </div>
        <div className="flex items-center gap-2">
          {e.transport_needed && (
            <button
              onClick={() => startTransition(() => toggleTransportConfirmed(e.id, !e.transport_confirmed))}
              className={clsx(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs",
                e.transport_confirmed ? "status-pill-ok" : "status-pill-soon"
              )}
            >
              <Car size={12} />
              {e.transport_confirmed ? "Confirmed" : "Needed"}
            </button>
          )}
          <button onClick={() => startTransition(() => deleteEvent(e.id))} className="text-muted hover:text-overdue">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  const d = entry.important;
  const days = daysUntil(entry.date);
  return (
    <div className="card flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-muted">
          {dateLabel} · {days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}
        </p>
        <p className="truncate text-sm font-medium text-text">{d.title}</p>
        <p className="text-xs text-muted">{d.recurrence === "yearly" ? "Yearly" : "Monthly"}</p>
      </div>
      <button onClick={() => startTransition(() => deleteImportantDate(d.id))} className="text-muted hover:text-overdue">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EventForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [transport, setTransport] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleTimeChange(v: string) {
    setTime(v);
    const hour = Number(v.split(":")[0]);
    setTransport(hour >= 18 || hour < 6);
  }

  function save() {
    if (!title.trim() || !date) return;
    startTransition(async () => {
      await createEvent({
        title: title.trim(),
        starts_at: new Date(`${date}T${time}:00+02:00`).toISOString(),
        location: location.trim(),
        transport_needed: transport,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New event" onClose={onClose}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => handleTimeChange(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location (optional)"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={transport} onChange={(e) => setTransport(e.target.checked)} />
        Transport needed (you can't drive safely at night)
      </label>
      <button onClick={save} disabled={pending} className="btn-primary w-full">
        Save event
      </button>
    </FormSheet>
  );
}

function ImportantDateForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [recurrence, setRecurrence] = useState<"yearly" | "monthly">("yearly");
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createImportantDate({ title: title.trim(), recurrence, month: recurrence === "yearly" ? month : null, day });
      onClose();
    });
  }

  return (
    <FormSheet title="New recurring date" onClose={onClose}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Supperclub, Colette's birthday"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as "yearly" | "monthly")}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text"
        >
          <option value="yearly">Yearly</option>
          <option value="monthly">Monthly</option>
        </select>
        {recurrence === "yearly" && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString("en-ZA", { month: "long" })}
              </option>
            ))}
          </select>
        )}
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className="w-20 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text"
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <button onClick={save} disabled={pending} className="btn-primary w-full">
        Save date
      </button>
    </FormSheet>
  );
}

function FormSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{title}</p>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
