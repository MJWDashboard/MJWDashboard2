"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Trash2, CalendarClock, Plus, Check } from "lucide-react";
import type { Task } from "@/lib/planTypes";
import {
  createTask,
  updateTask,
  deleteTask,
  setTodayPriority,
  scheduleTask,
  unscheduleTask,
  listSubtasks,
  type TaskInput,
} from "./actions";
import { FocusTimer } from "./FocusTimer";

const PRIORITIES = ["critical", "high", "normal", "low"] as const;
const STATUSES = ["inbox", "planned", "in_progress", "waiting", "complete", "cancelled"] as const;
const RECURRENCES = ["none", "daily", "weekly", "monthly"] as const;

export function TaskEditor({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>((task?.priority as (typeof PRIORITIES)[number]) ?? "normal");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>((task?.status as (typeof STATUSES)[number]) ?? "planned");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [dueTime, setDueTime] = useState(task?.due_time ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimated_minutes?.toString() ?? "");
  const [recurrence, setRecurrence] = useState<(typeof RECURRENCES)[number]>((task?.recurrence_rule as (typeof RECURRENCES)[number]) ?? "none");
  const [tags, setTags] = useState(task?.tags?.join(", ") ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [isPriorityToday, setIsPriorityToday] = useState(task?.is_today_priority ?? false);
  const [priorityError, setPriorityError] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (task) listSubtasks(task.id).then(setSubtasks);
  }, [task]);

  function buildInput(): TaskInput {
    return {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      due_date: dueDate || null,
      due_time: dueTime || null,
      estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      recurrence_rule: recurrence,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes: notes.trim() || null,
    };
  }

  function save() {
    if (!title.trim()) return;
    startTransition(async () => {
      if (task) {
        await updateTask(task.id, buildInput());
      } else {
        await createTask(buildInput());
      }
      onClose();
    });
  }

  function remove() {
    if (!task) return;
    startTransition(async () => {
      await deleteTask(task.id);
      onClose();
    });
  }

  function toggleTodayPriority() {
    if (!task) return;
    const next = !isPriorityToday;
    startTransition(async () => {
      const result = await setTodayPriority(task.id, next);
      if (result.error) {
        setPriorityError(result.error);
        return;
      }
      setPriorityError(null);
      setIsPriorityToday(next);
    });
  }

  function schedule() {
    if (!task || !dueDate || !dueTime) return;
    startTransition(async () => {
      await scheduleTask(task.id, { date: dueDate, time: dueTime, durationMinutes: Number(estimatedMinutes) || 30 });
    });
  }

  function unschedule() {
    if (!task) return;
    startTransition(async () => {
      await unscheduleTask(task.id);
    });
  }

  function addSubtask() {
    if (!task || !newSubtask.trim()) return;
    startTransition(async () => {
      await createTask({ title: newSubtask.trim(), parent_task_id: task.id, priority: "normal" });
      setNewSubtask("");
      setSubtasks(await listSubtasks(task.id));
    });
  }

  function toggleSubtask(sub: Task) {
    startTransition(async () => {
      await updateTask(sub.id, { status: sub.status === "complete" ? "planned" : "complete" });
      setSubtasks(await listSubtasks(task!.id));
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{task ? "Edit task" : "New task"}</p>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            autoFocus
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />

          <div className="grid grid-cols-2 gap-2">
            <Select label="Priority" value={priority} onChange={(v) => setPriority(v as typeof priority)} options={PRIORITIES} />
            <Select label="Status" value={status} onChange={(v) => setStatus(v as typeof status)} options={STATUSES} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
            <Field label="Due time">
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Estimated (min)">
              <input
                type="number"
                inputMode="numeric"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
            </Field>
            <Select label="Repeats" value={recurrence} onChange={(v) => setRecurrence(v as typeof recurrence)} options={RECURRENCES} />
          </div>

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags, comma separated"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />

          {task && (
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <span className="text-sm text-text">Today&apos;s priority</span>
              <button
                onClick={toggleTodayPriority}
                className={isPriorityToday ? "btn-primary px-3 py-1 text-xs" : "btn-secondary px-3 py-1 text-xs"}
              >
                {isPriorityToday ? "Main focus" : "Set as priority"}
              </button>
            </div>
          )}
          {priorityError && <p className="text-xs text-overdue">{priorityError}</p>}

          {task && dueDate && dueTime && (
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-sm text-text">
                <CalendarClock size={14} />
                {task.scheduled_event_id ? "On your calendar" : "Time block"}
              </span>
              {task.scheduled_event_id ? (
                <button onClick={unschedule} className="btn-secondary px-3 py-1 text-xs">
                  Remove
                </button>
              ) : (
                <button onClick={schedule} className="btn-secondary px-3 py-1 text-xs">
                  Add to calendar
                </button>
              )}
            </div>
          )}

          {task && (
            <div className="space-y-2 rounded-xl border border-border p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Subtasks</p>
              {subtasks.map((sub) => (
                <button key={sub.id} onClick={() => toggleSubtask(sub)} className="flex w-full items-center gap-2 text-left text-sm">
                  <span
                    className={
                      sub.status === "complete"
                        ? "flex h-4 w-4 items-center justify-center rounded-full bg-ok text-white"
                        : "h-4 w-4 rounded-full border border-border"
                    }
                  >
                    {sub.status === "complete" && <Check size={10} />}
                  </span>
                  <span className={sub.status === "complete" ? "text-muted line-through" : "text-text"}>{sub.title}</span>
                </button>
              ))}
              <div className="flex gap-2">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                  placeholder="Add subtask"
                  className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
                />
                <button onClick={addSubtask} className="btn-secondary px-2" aria-label="Add subtask">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {task && <FocusTimer taskId={task.id} estimatedMinutes={task.estimated_minutes} actualMinutes={task.actual_minutes} />}

          <div className="flex gap-2 pt-1">
            {task && (
              <button onClick={remove} disabled={pending} aria-label="Delete task" className="btn-secondary px-3 text-overdue">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={save} disabled={pending || !title.trim()} className="btn-primary flex-1">
              {pending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function Select<T extends readonly string[]>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: T;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace("_", " ")}
          </option>
        ))}
      </select>
    </Field>
  );
}
