"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, X, Check, Target, ArrowRight } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatZAR } from "@/lib/money";
import { createGoal, updateGoal, deleteGoal, createMilestone, toggleMilestone, deleteMilestone } from "./actions";

type Goal = Tables<"goals">;
type Milestone = Tables<"goal_milestones">;
type SavingsGoal = Pick<Tables<"savings_goals">, "id" | "title" | "current_amount" | "target_amount">;

const AREAS = ["personal", "financial", "wellness", "career", "home", "travel", "creative", "learning", "other"] as const;
const STATUSES = ["planned", "active", "paused", "complete", "abandoned"] as const;
const VIEWS = ["Current", "This year", "Completed", "Archived"] as const;

export function GoalsClient({
  goals,
  milestones,
  savingsGoals,
  linkedTasks,
  linkedHabits,
}: {
  goals: Goal[];
  milestones: Milestone[];
  savingsGoals: SavingsGoal[];
  linkedTasks: { id: string; goal_id: string | null; status: string }[];
  linkedHabits: { id: string; goal_id: string | null }[];
}) {
  const [view, setView] = useState<(typeof VIEWS)[number]>("Current");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const thisYear = new Date().getFullYear();

  const filtered = goals.filter((g) => {
    if (view === "Current") return g.status === "active" || g.status === "planned" || g.status === "paused";
    if (view === "This year") return g.deadline && new Date(g.deadline).getFullYear() === thisYear;
    if (view === "Completed") return g.status === "complete";
    return g.status === "abandoned";
  });

  return (
    <div className="space-y-4">
      <PageHeader icon={Target} color="#0FAE9C" eyebrow="Life Planning" title="Goals" />

      <div className="flex gap-1 overflow-x-auto">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", view === v ? "bg-accent text-white" : "border border-border text-muted")}
          >
            {v}
          </button>
        ))}
      </div>

      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add goal
      </button>

      {filtered.length === 0 ? (
        <EmptyState icon={Target} title="Nothing here" detail="Set a goal with a purpose and a target — Core will keep its next action visible." />
      ) : (
        <div className="space-y-2">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              milestones={milestones.filter((m) => m.goal_id === goal.id)}
              savingsGoal={savingsGoals.find((s) => s.id === goal.linked_savings_goal_id)}
              taskCount={linkedTasks.filter((t) => t.goal_id === goal.id && t.status !== "complete" && t.status !== "cancelled").length}
              habitCount={linkedHabits.filter((h) => h.goal_id === goal.id).length}
              onEdit={() => setEditing(goal)}
            />
          ))}
        </div>
      )}

      {showForm && <GoalForm savingsGoals={savingsGoals} onClose={() => setShowForm(false)} />}
      {editing && (
        <GoalForm
          goal={editing}
          savingsGoals={savingsGoals}
          milestones={milestones.filter((m) => m.goal_id === editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function GoalCard({
  goal,
  milestones,
  savingsGoal,
  taskCount,
  habitCount,
  onEdit,
}: {
  goal: Goal;
  milestones: Milestone[];
  savingsGoal?: SavingsGoal;
  taskCount: number;
  habitCount: number;
  onEdit: () => void;
}) {
  const done = milestones.filter((m) => m.done).length;
  return (
    <button onClick={onEdit} className="card block w-full space-y-2 text-left">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">{goal.title}</p>
        <span className="rounded-full bg-border px-2 py-0.5 text-[10px] capitalize text-muted">{goal.area}</span>
      </div>
      {goal.next_action && (
        <p className="flex items-center gap-1.5 text-xs text-accent">
          <ArrowRight size={12} /> {goal.next_action}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {goal.deadline && <span>{new Date(goal.deadline).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}</span>}
        {milestones.length > 0 && <span>{done}/{milestones.length} milestones</span>}
        {taskCount > 0 && <span>{taskCount} open task{taskCount === 1 ? "" : "s"}</span>}
        {habitCount > 0 && <span>{habitCount} habit{habitCount === 1 ? "" : "s"}</span>}
        {savingsGoal && (
          <span data-sensitive className="tabular">
            {formatZAR(Number(savingsGoal.current_amount))}/{formatZAR(Number(savingsGoal.target_amount))}
          </span>
        )}
      </div>
    </button>
  );
}

function GoalForm({
  goal,
  savingsGoals,
  milestones = [],
  onClose,
}: {
  goal?: Goal;
  savingsGoals: SavingsGoal[];
  milestones?: Milestone[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [purpose, setPurpose] = useState(goal?.purpose ?? "");
  const [area, setArea] = useState<(typeof AREAS)[number]>((goal?.area as (typeof AREAS)[number]) ?? "personal");
  const [target, setTarget] = useState(goal?.target ?? "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>((goal?.status as (typeof STATUSES)[number]) ?? "active");
  const [nextAction, setNextAction] = useState(goal?.next_action ?? "");
  const [linkedSavings, setLinkedSavings] = useState(goal?.linked_savings_goal_id ?? "");
  const [newMilestone, setNewMilestone] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!title.trim()) return;
    const fields = {
      title: title.trim(),
      purpose: purpose.trim() || null,
      area,
      target: target.trim() || null,
      deadline: deadline || null,
      status,
      next_action: nextAction.trim() || null,
      linked_savings_goal_id: linkedSavings || null,
    };
    startTransition(async () => {
      if (goal) await updateGoal(goal.id, fields);
      else await createGoal(fields);
      onClose();
    });
  }

  function addMilestone() {
    if (!goal || !newMilestone.trim()) return;
    startTransition(async () => {
      await createMilestone(goal.id, newMilestone.trim());
      setNewMilestone("");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{goal ? "Edit goal" : "New goal"}</p>
          <button onClick={onClose} className="text-muted hover:text-text" aria-label="Close"><X size={18} /></button>
        </div>

        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Why this matters (optional)" rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <div className="grid grid-cols-2 gap-2">
          <select value={area} onChange={(e) => setArea(e.target.value as (typeof AREAS)[number])} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (e.g. Run 10km, Save R50,000)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next action" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />

        {savingsGoals.length > 0 && (
          <select value={linkedSavings} onChange={(e) => setLinkedSavings(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
            <option value="">No linked savings goal</option>
            {savingsGoals.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        )}

        {goal && (
          <div className="space-y-2 rounded-xl border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Milestones</p>
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <button
                  onClick={() => startTransition(() => toggleMilestone(m.id, !m.done))}
                  className={clsx("flex h-5 w-5 items-center justify-center rounded-full border", m.done ? "border-ok bg-ok text-white" : "border-border")}
                  aria-label={m.done ? "Mark milestone incomplete" : "Mark milestone done"}
                >
                  {m.done && <Check size={12} />}
                </button>
                <span className={clsx("flex-1 text-sm", m.done ? "text-muted line-through" : "text-text")}>{m.title}</span>
                <button onClick={() => startTransition(() => deleteMilestone(m.id))} className="text-muted hover:text-overdue" aria-label="Delete milestone">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMilestone()} placeholder="Add milestone" className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-text outline-none focus:border-accent" />
              <button onClick={addMilestone} className="btn-secondary px-2" aria-label="Add milestone"><Plus size={14} /></button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {goal && (
            <button onClick={() => startTransition(async () => { await deleteGoal(goal.id); onClose(); })} className="btn-secondary px-3 text-overdue" aria-label="Delete goal">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={save} disabled={pending} className="btn-primary flex-1">{goal ? "Save changes" : "Save goal"}</button>
        </div>
      </div>
    </div>
  );
}
