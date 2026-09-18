"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/StatusBadge";
import { MEETING_STATUS_CLASSES, enumLabel } from "@/lib/status";
import { formatDateTime } from "@/lib/format";

export function MeetingsTable({ meetings }: { meetings: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return meetings;
    return meetings.filter((m) =>
      `${m.title} ${m.buildings?.name ?? ""} ${(m.attendees ?? []).join(" ")}`
        .toLowerCase()
        .includes(term)
    );
  }, [meetings, search]);

  return (
    <div>
      <input
        className="input mb-4 w-72"
        placeholder="Search by title, building or attendee…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="table-shell">
        <table className="table-base">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Building</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>
                  <Link href={`/dashboard/meetings/${m.id}`} className="font-medium text-cyan-400 hover:underline">
                    {m.title}
                  </Link>
                </td>
                <td>{m.meeting_type ?? "—"}</td>
                <td>{m.buildings?.name ?? "—"}</td>
                <td>{formatDateTime(m.meeting_date)}</td>
                <td>
                  <Badge label={enumLabel(m.status)} className={MEETING_STATUS_CLASSES[m.status] ?? ""} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
