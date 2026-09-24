"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, PiggyBank } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { requiredMonthlyContribution, formatZAR } from "@/lib/money";
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from "./actions";
import { FormSheet } from "./MoneyClient";

type SavingsGoal = Tables<"savings_goals">;
type Account = Tables<"accounts">;

export function SavingsTab({ goals, accounts }: { goals: SavingsGoal[]; accounts: Account[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [, startTransition] = useTransition();

  const active = goals.filter((g) => g.status !== "complete");
  const complete = goals.filter((g) => g.status === "complete");

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add savings goal
      </button>

      {active.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No savings goals yet" detail="Emergency fund, holiday, a vehicle — set a target and see what it takes each month." />
      ) : (
        <div className="space-y-2">
          {active.map((goal) => {
            const pct = Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100);
            const required = requiredMonthlyContribution(goal);
            const linkedAccount = accounts.find((a) => a.id === goal.linked_account_id);
            return (
              <div key={goal.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text">{goal.title}</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setEditing(goal)} className="text-muted hover:text-text" aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => startTransition(() => deleteSavingsGoal(goal.id))} className="text-muted hover:text-overdue" aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span data-sensitive className="tabular">
                    {formatZAR(Number(goal.current_amount))} / {formatZAR(Number(goal.target_amount))}
                  </span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-ok" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted">
                  {goal.target_date && <span>Target: {new Date(goal.target_date).toLocaleDateString("en-ZA")}</span>}
                  {required !== null && <span data-sensitive className="tabular">Needs {formatZAR(required)}/mo</span>}
                  {linkedAccount && <span>{linkedAccount.name}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {complete.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Complete</p>
          <div className="space-y-2">
            {complete.map((g) => (
              <div key={g.id} className="card flex items-center justify-between opacity-60">
                <span className="text-sm text-text">{g.title}</span>
                <span data-sensitive className="tabular text-sm text-ok">{formatZAR(Number(g.target_amount))}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {showForm && <SavingsGoalForm accounts={accounts} onClose={() => setShowForm(false)} />}
      {editing && <SavingsGoalForm accounts={accounts} goal={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SavingsGoalForm({ goal, accounts, onClose }: { goal?: SavingsGoal; accounts: Account[]; onClose: () => void }) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [target, setTarget] = useState(goal?.target_amount?.toString() ?? "");
  const [current, setCurrent] = useState(goal?.current_amount?.toString() ?? "0");
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const [linkedAccountId, setLinkedAccountId] = useState(goal?.linked_account_id ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!title.trim() || !target) return;
    const fields = {
      title: title.trim(),
      target_amount: Number(target),
      current_amount: Number(current) || 0,
      target_date: targetDate || null,
      monthly_contribution: null,
      linked_account_id: linkedAccountId || null,
    };
    startTransition(async () => {
      if (goal) await updateSavingsGoal(goal.id, fields);
      else await createSavingsGoal(fields);
      onClose();
    });
  }

  return (
    <FormSheet title={goal ? "Edit savings goal" : "New savings goal"} onClose={onClose}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Emergency fund" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" placeholder="Target amount" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={current} onChange={(e) => setCurrent(e.target.value)} type="number" placeholder="Current amount" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={targetDate} onChange={(e) => setTargetDate(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <select value={linkedAccountId} onChange={(e) => setLinkedAccountId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        <option value="">No linked account</option>
        {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
      <button onClick={save} disabled={pending} className="btn-primary w-full">{goal ? "Save changes" : "Save goal"}</button>
    </FormSheet>
  );
}
