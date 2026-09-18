"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImportantDateFormButton } from "./ImportantDateForm";

type EventItem = {
  id: string;
  title: string;
  due_date: string;
  status: string;
  date_type: string | null;
  building_id: string | null;
  tenant_id: string | null;
  buildings: { name: string } | null;
  tenants: { trading_name: string } | null;
};

const STATUS_DOT: Record<string, string> = {
  not_started: "bg-charcoal-400",
  in_progress: "bg-cyan-400",
  waiting_on_feedback: "bg-yellow-400",
  complete: "bg-green-400",
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function CalendarGrid({
  year,
  month,
  events,
  buildings,
  tenants,
}: {
  year: number;
  month: number;
  events: EventItem[];
  buildings: { id: string; name: string }[];
  tenants: { id: string; trading_name: string }[];
}) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventsByDay = new Map<string, EventItem[]>();
  for (const event of events) {
    const key = event.due_date.slice(0, 10);
    const list = eventsByDay.get(key) ?? [];
    list.push(event);
    eventsByDay.set(key, list);
  }

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstDay.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?month=${prevMonth.getFullYear()}-${pad(prevMonth.getMonth() + 1)}`}
            className="rounded p-2 text-charcoal-300 hover:bg-charcoal-800"
          >
            <ChevronLeft size={18} />
          </Link>
          <h2 className="w-40 text-center text-sm font-semibold text-charcoal-100">{monthLabel}</h2>
          <Link
            href={`/calendar?month=${nextMonth.getFullYear()}-${pad(nextMonth.getMonth() + 1)}`}
            className="rounded p-2 text-charcoal-300 hover:bg-charcoal-800"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-card border border-charcoal-700 bg-charcoal-700">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-charcoal-800 py-2 text-center text-xs font-semibold uppercase text-charcoal-300">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const key = day ? toDateKey(year, month, day) : null;
          const dayEvents = key ? eventsByDay.get(key) ?? [] : [];
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={`min-h-28 bg-charcoal-900 p-2 ${day ? "" : "bg-charcoal-900/40"}`}
            >
              {day && (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`text-xs ${isToday ? "rounded-full bg-cyan-600 px-1.5 py-0.5 text-charcoal-950" : "text-charcoal-400"}`}
                    >
                      {day}
                    </span>
                    <ImportantDateFormButton
                      label="+"
                      buildings={buildings}
                      tenants={tenants}
                      defaultDate={key!}
                      compact
                    />
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <ImportantDateFormButton
                        key={event.id}
                        item={event as any}
                        label={event.title}
                        buildings={buildings}
                        tenants={tenants}
                        compact
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-charcoal-400">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
