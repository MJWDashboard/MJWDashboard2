"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square, Timer } from "lucide-react";
import { startFocusSession, endFocusSession } from "./actions";

type Mode = "stopwatch" | "25" | "50" | "custom";
const PRESETS: { mode: Mode; label: string; minutes: number | null }[] = [
  { mode: "stopwatch", label: "Stopwatch", minutes: null },
  { mode: "25", label: "25 min", minutes: 25 },
  { mode: "50", label: "50 min", minutes: 50 },
];

export function FocusTimer({
  taskId,
  estimatedMinutes,
  actualMinutes,
}: {
  taskId: string;
  estimatedMinutes: number | null;
  actualMinutes: number;
}) {
  const [running, setRunning] = useState<{ sessionId: string; mode: Mode; startedAt: number; plannedMinutes: number | null } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - running.startedAt) / 1000)), 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  async function start(mode: Mode, minutes: number | null) {
    const result = await startFocusSession(taskId, mode, minutes);
    if (result.id) {
      setRunning({ sessionId: result.id, mode, startedAt: Date.now(), plannedMinutes: minutes });
      setElapsed(0);
    }
  }

  async function stop() {
    if (!running) return;
    await endFocusSession(running.sessionId, taskId);
    setRunning(null);
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const overtime = running?.plannedMinutes ? elapsed > running.plannedMinutes * 60 : false;

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Timer size={14} />
          Focus timer
        </span>
        <span>
          {actualMinutes}m logged{estimatedMinutes ? ` of ${estimatedMinutes}m planned` : ""}
        </span>
      </div>

      {running ? (
        <div className="flex items-center justify-between">
          <p className={overtime ? "font-mono text-lg text-overdue" : "font-mono text-lg text-text"}>
            {mm}:{ss}
          </p>
          <button onClick={stop} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs">
            <Square size={12} /> Stop
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.mode}
              onClick={() => start(p.mode, p.minutes)}
              className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <Play size={12} /> {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
