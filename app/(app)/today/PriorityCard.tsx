"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Star } from "lucide-react";
import type { Task } from "@/lib/planTypes";
import { PRIORITY_LABEL } from "@/lib/planTypes";
import { setTaskStatus, setMainFocus } from "@/app/(app)/plan/actions";

const PRIORITY_COLOR: Record<string, string> = {
  critical: "rgb(var(--color-overdue))",
  high: "rgb(var(--color-soon))",
  normal: "rgb(var(--color-accent))",
  low: "rgb(var(--color-muted))",
};

export function PriorityCard({ task, isMainFocus }: { task: Task; isMainFocus: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const done = task.status === "complete";

  function toggle() {
    startTransition(async () => {
      await setTaskStatus(task.id, done ? "planned" : "complete");
      router.refresh();
    });
  }

  function makeMainFocus() {
    startTransition(async () => {
      await setMainFocus(task.id);
      router.refresh();
    });
  }

  return (
    <div className={clsx("card flex items-start gap-3", done && "opacity-50", isMainFocus && !done && "border-accent/50")}>
      <button
        onClick={toggle}
        disabled={pending}
        aria-label={done ? "Mark not done" : "Mark done"}
        className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", done ? "border-ok bg-ok" : "border-border")}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isMainFocus && !done && <Star size={13} className="shrink-0 fill-accent text-accent" />}
          <Link href="/plan" className={clsx("truncate text-sm text-text", done && "line-through")}>
            {task.title}
          </Link>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span style={{ color: PRIORITY_COLOR[task.priority] }}>{PRIORITY_LABEL[task.priority]}</span>
          {task.due_time && <span>{task.due_time.slice(0, 5)}</span>}
          {task.estimated_minutes && <span>{task.estimated_minutes}m</span>}
        </div>
      </div>
      {!isMainFocus && !done && (
        <button onClick={makeMainFocus} disabled={pending} className="shrink-0 text-xs text-muted hover:text-accent">
          Main focus
        </button>
      )}
    </div>
  );
}
