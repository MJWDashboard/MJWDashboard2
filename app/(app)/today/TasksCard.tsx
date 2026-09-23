"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Pencil, X } from "lucide-react";
import { clsx } from "clsx";
import type { Tables } from "@/lib/supabase/database.types";
import { TASK_CAPACITY, TASK_TIERS, type TaskTier } from "@/lib/taskConstants";
import { addTask, updateTask, toggleTask, deleteTask } from "./actions";

type Task = Tables<"tasks">;

const TIER_LABEL: Record<TaskTier, string> = { critical: "Critical", important: "Important", admin: "Admin" };
const TIER_COLOR: Record<TaskTier, string> = {
  critical: "rgb(var(--color-overdue))",
  important: "rgb(var(--color-soon))",
  admin: "rgb(var(--color-accent))",
};

export function TasksCard({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [tier, setTier] = useState<TaskTier>("important");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const countByTier = (t: TaskTier) => tasks.filter((task) => task.tier === t).length;

  function submit() {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addTask(title.trim(), tier);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTitle("");
      router.refresh();
    });
  }

  function toggle(task: Task) {
    startTransition(async () => {
      await toggleTask(task.id, !task.done);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteTask(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {TASK_TIERS.map((t) => (
          <div key={t} className="card flex-1 py-2 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: TIER_COLOR[t] }}>
              {TIER_LABEL[t]}
            </p>
            <p className="text-sm font-semibold text-text">
              {countByTier(t)}/{TASK_CAPACITY[t]}
            </p>
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) =>
            editingId === task.id ? (
              <TaskEditRow key={task.id} task={task} onDone={() => setEditingId(null)} />
            ) : (
              <div key={task.id} className={clsx("card flex items-center gap-3", task.done && "opacity-50")}>
                <button
                  onClick={() => toggle(task)}
                  className={clsx(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    task.done ? "border-ok bg-ok text-white" : "border-border"
                  )}
                  aria-label={task.done ? "Mark not done" : "Mark done"}
                >
                  {task.done && <Check size={12} />}
                </button>
                <div className="flex-1">
                  <p className={clsx("text-sm text-text", task.done && "line-through")}>{task.title}</p>
                  <p className="text-xs" style={{ color: TIER_COLOR[task.tier as TaskTier] }}>
                    {TIER_LABEL[task.tier as TaskTier]}
                  </p>
                </div>
                <button onClick={() => setEditingId(task.id)} className="text-muted hover:text-text" aria-label="Edit task">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(task.id)} className="text-muted hover:text-overdue" aria-label="Remove task">
                  <X size={14} />
                </button>
              </div>
            )
          )}
        </div>
      )}

      <div className="card space-y-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a task"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
          />
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as TaskTier)}
            className="rounded-xl border border-border bg-background px-2 py-2.5 text-sm text-text outline-none focus:border-accent"
          >
            {TASK_TIERS.map((t) => (
              <option key={t} value={t}>
                {TIER_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-xs text-overdue">{error}</p>}
        <button onClick={submit} disabled={pending || !title.trim()} className="btn-secondary flex w-full items-center justify-center gap-1 text-sm">
          <Plus size={14} /> Add task
        </button>
      </div>
    </div>
  );
}

function TaskEditRow({ task, onDone }: { task: Task; onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(task.title);
  const [tier, setTier] = useState<TaskTier>(task.tier as TaskTier);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTask(task.id, title.trim(), tier);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <div className="card space-y-2">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as TaskTier)}
          className="rounded-xl border border-border bg-background px-2 py-2 text-sm text-text outline-none focus:border-accent"
        >
          {TASK_TIERS.map((t) => (
            <option key={t} value={t}>
              {TIER_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-overdue">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onDone} className="btn-secondary flex-1 text-sm">
          Cancel
        </button>
        <button onClick={save} disabled={pending} className="btn-primary flex-1 text-sm">
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
