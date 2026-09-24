"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CalendarDays, Car, Plus, Trash2, Pencil, X, RefreshCw, Unlink, ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import { SAST } from "@/lib/timezone";
import { occurrencesInRange, daysUntil } from "@/lib/recurrence";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  toggleTransportConfirmed,
  createImportantDate,
  updateImportantDate,
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

type ViewMode = "month" | "week" | "day";

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function shiftCursor(view: ViewMode, cursor: Date, direction: 1 | -1) {
  if (view === "month") return direction > 0 ? addMonths(cursor, 1) : subMonths(cursor, 1);
  if (view === "week") return direction > 0 ? addWeeks(cursor, 1) : subWeeks(cursor, 1);
  return direction > 0 ? addDays(cursor, 1) : subDays(cursor, 1);
}

function headerTitle(view: ViewMode, cursor: Date) {
  if (view === "month") return format(cursor, "MMMM yyyy");
  if (view === "week") {
    const start = startOfWeek(cursor, { weekStartsOn: 1 });
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    return start.getMonth() === end.getMonth()
      ? `${format(start, "d")} – ${format(end, "d MMM yyyy")}`
      : `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
  }
  return format(cursor, "EEEE, d MMMM yyyy");
}

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
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => toZonedTime(new Date(), SAST));
  const [selectedDay, setSelectedDay] = useState(() => toZonedTime(new Date(), SAST));

  const range = useMemo(() => {
    if (view === "month") {
      return { start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) };
    }
    if (view === "week") {
      return { start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) };
    }
    return { start: startOfDay(cursor), end: endOfDay(cursor) };
  }, [view, cursor]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, AgendaEntry[]>();
    const push = (key: string, entry: AgendaEntry) => {
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    };

    for (const e of initialEvents) {
      const zoned = toZonedTime(new Date(e.starts_at), SAST);
      if (zoned < range.start || zoned > range.end) continue;
      push(dayKey(zoned), { kind: "event", date: zoned, event: e });
    }

    for (const d of initialImportantDates) {
      const occurrences = occurrencesInRange(d.recurrence as "yearly" | "monthly", d.month, d.day, range.start, range.end);
      for (const occ of occurrences) push(dayKey(occ), { kind: "important", date: occ, important: d });
    }

    for (const list of map.values()) list.sort((a, b) => a.date.getTime() - b.date.getTime());
    return map;
  }, [initialEvents, initialImportantDates, range]);

  function goToday() {
    const now = toZonedTime(new Date(), SAST);
    setCursor(now);
    setSelectedDay(now);
  }

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

      <div className="flex rounded-full border border-border bg-surface/60 p-1 text-xs">
        {(["month", "week", "day"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              "flex-1 rounded-full py-1.5 font-medium capitalize transition",
              view === v ? "bg-accent text-white" : "text-muted"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between p-2">
        <button
          onClick={() => setCursor((c) => shiftCursor(view, c, -1))}
          aria-label="Previous"
          className="rounded-lg p-2 text-muted hover:text-text"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col items-center">
          <p className="text-sm font-semibold text-text">{headerTitle(view, cursor)}</p>
          <button onClick={goToday} className="text-[11px] font-medium text-accent">
            Today
          </button>
        </div>
        <button
          onClick={() => setCursor((c) => shiftCursor(view, c, 1))}
          aria-label="Next"
          className="rounded-lg p-2 text-muted hover:text-text"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {view === "month" && (
        <>
          <MonthGrid cursor={cursor} entriesByDay={entriesByDay} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
          <DayAgenda day={selectedDay} entries={entriesByDay.get(dayKey(selectedDay)) ?? []} />
        </>
      )}

      {view === "week" && <WeekAgenda cursor={cursor} entriesByDay={entriesByDay} />}

      {view === "day" && <DayAgenda day={cursor} entries={entriesByDay.get(dayKey(cursor)) ?? []} />}

      {showEventForm && <EventForm onClose={() => setShowEventForm(false)} />}
      {showDateForm && <ImportantDateForm onClose={() => setShowDateForm(false)} />}
    </div>
  );
}

function MonthGrid({
  cursor,
  entriesByDay,
  selectedDay,
  onSelectDay,
}: {
  cursor: Date;
  entriesByDay: Map<string, AgendaEntry[]>;
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
}) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="card space-y-2 p-3">
      <div className="grid grid-cols-7 text-center text-[10px] font-medium uppercase tracking-wide text-muted">
        {weekdayLabels.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = dayKey(day);
          const entries = entriesByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const today = isToday(day);
          const selected = isSameDay(day, selectedDay);
          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={clsx(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm transition",
                !inMonth && "opacity-30",
                selected
                  ? "bg-accent text-white"
                  : today
                    ? "border border-accent text-text"
                    : "text-text hover:bg-border/40"
              )}
            >
              <span>{format(day, "d")}</span>
              {entries.length > 0 && (
                <span className="flex gap-0.5">
                  {entries.slice(0, 3).map((e, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: selected
                          ? "#fff"
                          : e.kind === "important"
                            ? "rgb(var(--color-soon))"
                            : "rgb(var(--color-accent))",
                      }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekAgenda({ cursor, entriesByDay }: { cursor: Date; entriesByDay: Map<string, AgendaEntry[]> }) {
  const days = eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) });

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const key = dayKey(day);
        const entries = entriesByDay.get(key) ?? [];
        return (
          <div key={key}>
            <p className={clsx("mb-1.5 text-xs font-semibold uppercase tracking-wide", isToday(day) ? "text-accent" : "text-muted")}>
              {format(day, "EEEE, d MMM")}
            </p>
            {entries.length === 0 ? (
              <p className="pl-1 text-xs text-muted/70">Nothing</p>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <AgendaRow key={entry.kind + (entry.kind === "event" ? entry.event.id : entry.important.id + key)} entry={entry} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayAgenda({ day, entries }: { day: Date; entries: AgendaEntry[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{format(day, "EEEE, d MMMM")}</p>
      {entries.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing this day" detail="Add an event or a recurring date to get started." />
      ) : (
        entries.map((entry) => (
          <AgendaRow key={entry.kind + (entry.kind === "event" ? entry.event.id : entry.important.id)} entry={entry} />
        ))
      )}
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
  const [editing, setEditing] = useState(false);
  const dateLabel = entry.date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

  if (entry.kind === "event") {
    const e = entry.event;
    const timeLabel = new Date(e.starts_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
    return (
      <div className="card flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted">{dateLabel} · {timeLabel}</p>
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium text-text">{e.title}</p>
            {e.module === "plan" && (
              <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                Task
              </span>
            )}
            {e.source === "google" && (
              <span className="shrink-0 rounded-full bg-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                Google
              </span>
            )}
          </div>
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
          <button onClick={() => setEditing(true)} className="text-muted hover:text-text" aria-label="Edit event">
            <Pencil size={14} />
          </button>
          <button onClick={() => startTransition(() => deleteEvent(e.id))} className="text-muted hover:text-overdue" aria-label="Delete event">
            <Trash2 size={14} />
          </button>
        </div>
        {editing && <EventForm event={e} onClose={() => setEditing(false)} />}
      </div>
    );
  }

  const d = entry.important;
  const days = daysUntil(entry.date);
  return (
    <div className="card flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-muted">
          {dateLabel} · {days === 0 ? "today" : days > 0 ? `in ${days} day${days === 1 ? "" : "s"}` : `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`}
        </p>
        <p className="truncate text-sm font-medium text-text">{d.title}</p>
        <p className="text-xs text-muted">{d.recurrence === "yearly" ? "Yearly" : "Monthly"}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(true)} className="text-muted hover:text-text" aria-label="Edit date">
          <Pencil size={14} />
        </button>
        <button onClick={() => startTransition(() => deleteImportantDate(d.id))} className="text-muted hover:text-overdue" aria-label="Delete date">
          <Trash2 size={14} />
        </button>
      </div>
      {editing && <ImportantDateForm date={d} onClose={() => setEditing(false)} />}
    </div>
  );
}

function EventForm({ event, onClose }: { event?: EventRow; onClose: () => void }) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.starts_at?.slice(0, 10) ?? "");
  const [time, setTime] = useState(event?.starts_at ? new Date(event.starts_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false }) : "18:00");
  const [location, setLocation] = useState(event?.location ?? "");
  const [transport, setTransport] = useState(event?.transport_needed ?? false);
  const [pending, startTransition] = useTransition();

  function handleTimeChange(v: string) {
    setTime(v);
    const hour = Number(v.split(":")[0]);
    setTransport(hour >= 18 || hour < 6);
  }

  function save() {
    if (!title.trim() || !date) return;
    startTransition(async () => {
      const fields = {
        title: title.trim(),
        starts_at: new Date(`${date}T${time}:00+02:00`).toISOString(),
        location: location.trim() || null,
        transport_needed: transport,
      };
      if (event) {
        await updateEvent(event.id, fields);
      } else {
        await createEvent(fields);
      }
      onClose();
    });
  }

  return (
    <FormSheet title={event ? "Edit event" : "New event"} onClose={onClose}>
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
        {event ? "Save changes" : "Save event"}
      </button>
    </FormSheet>
  );
}

function ImportantDateForm({ date: existing, onClose }: { date?: ImportantDate; onClose: () => void }) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [recurrence, setRecurrence] = useState<"yearly" | "monthly">((existing?.recurrence as "yearly" | "monthly") ?? "yearly");
  const [month, setMonth] = useState(existing?.month ?? 1);
  const [day, setDay] = useState(existing?.day ?? 1);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!title.trim()) return;
    startTransition(async () => {
      const fields = { title: title.trim(), recurrence, month: recurrence === "yearly" ? month : null, day };
      if (existing) {
        await updateImportantDate(existing.id, fields);
      } else {
        await createImportantDate(fields);
      }
      onClose();
    });
  }

  return (
    <FormSheet title={existing ? "Edit recurring date" : "New recurring date"} onClose={onClose}>
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
        {existing ? "Save changes" : "Save date"}
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
