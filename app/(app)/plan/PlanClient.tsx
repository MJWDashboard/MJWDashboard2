"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { Plus, Clock, ChevronRight, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/EmptyState";
import type { Task, PlanView } from "@/lib/planTypes";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/planTypes";
import { setTaskStatus, postponeTask } from "./actions";
import { TaskEditor } from "./TaskEditor";

const VIEWS: { key: PlanView; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "upcoming", label: "Upcoming" },
  { key: "backlog", label: "Backlog" },
];

const PRIORITY_COLOR: Record<string, string> = {
  critical: "rgb(var(--color-overdue))",
  high: "rgb(var(--color-soon))",
  normal: "rgb(var(--color-accent))",
  low: "rgb(var(--color-muted))",
};

export function PlanClient({
  view,
  initialTasks,
  capacity,
}: {
  view: PlanView;
  initialTasks: Task[];
  capacity: { plannedMinutes: number; availableMinutes: number } | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState(initialTasks);
  const [editing, setEditing] = useState<Task | null | "new">(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [, startTransition] = useTransition();

  const overCapacity = capacity && capacity.plannedMinutes > capacity.availableMinutes;

  function toggleComplete(task: Task) {
    const nextStatus = task.status === "complete" ? "planned" : "complete";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus, done: nextStatus === "complete" } : t)));
    startTransition(async () => {
      await setTaskStatus(task.id, nextStatus);
      router.refresh();
    });
  }

  function moveLowestPriority() {
    const lowest = [...tasks]
      .filter((t) => t.status !== "complete" && t.status !== "cancelled")
      .sort((a, b) => "low normal high critical".indexOf(a.priority) - "low normal high critical".indexOf(b.priority))[0];
    if (!lowest) return;
    startTransition(async () => {
      await postponeTask(lowest.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto rounded-[10px] border border-border bg-surface p-1">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/plan?view=${v.key}`}
            className={clsx(
              "shrink-0 rounded-[8px] px-3 py-1.5 text-sm font-medium transition",
              (searchParams.get("view") ?? "today") === v.key ? "bg-accent text-white" : "text-muted hover:text-text"
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {overCapacity && !dismissedWarning && (
        <div className="card flex flex-wrap items-center gap-3 border-soon/40 bg-soon/10">
          <AlertTriangle size={18} className="shrink-0 text-soon" />
          <p className="flex-1 text-sm text-text">
            Today&apos;s plan exceeds your available time by{" "}
            {Math.round((capacity!.plannedMinutes - capacity!.availableMinutes) / 60 * 10) / 10}h.
          </p>
          <button onClick={moveLowestPriority} className="btn-secondary px-3 py-1.5 text-xs">
            Move lowest priority
          </button>
          <button onClick={() => setDismissedWarning(true)} className="btn-secondary px-3 py-1.5 text-xs">
            Keep anyway
          </button>
        </div>
      )}

      <button onClick={() => setEditing("new")} className="btn-secondary flex w-full items-center justify-center gap-1.5 text-sm">
        <Plus size={16} /> Add task
      </button>

      {tasks.length === 0 ? (
        <EmptyState icon={Clock} title="Nothing here" detail="Add a task, or check another view." />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={() => toggleComplete(task)} onEdit={() => setEditing(task)} />
          ))}
        </div>
      )}

      {editing && (
        <TaskEditor
          task={editing === "new" ? null : editing}
          onClose={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onEdit }: { task: Task; onToggle: () => void; onEdit: () => void }) {
  const done = task.status === "complete";
  return (
    <div className={clsx("card flex items-center gap-3", done && "opacity-50")}>
      <button
        onClick={onToggle}
        aria-label={done ? "Mark not done" : "Mark done"}
        className={clsx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
          done ? "border-ok bg-ok" : "border-border"
        )}
      />
      <button onClick={onEdit} className="flex-1 text-left">
        <p className={clsx("text-sm text-text", done && "line-through")}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="flex items-center gap-1" style={{ color: PRIORITY_COLOR[task.priority] }}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.due_date && (
            <span>
              {format(new Date(task.due_date), "d MMM")}
              {task.due_time ? ` · ${task.due_time}` : ""}
            </span>
          )}
          {task.estimated_minutes && <span>{task.estimated_minutes}m</span>}
          {task.status !== "complete" && task.status !== "planned" && (
            <span className="status-pill bg-border text-muted">{STATUS_LABEL[task.status]}</span>
          )}
        </div>
      </button>
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </div>
  );
}
