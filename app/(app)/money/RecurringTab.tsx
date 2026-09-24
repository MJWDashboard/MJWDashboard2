"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, Pencil, RefreshCw, AlertTriangle } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { recurringMonthlyCost, recurringAnnualCost, formatZAR } from "@/lib/money";
import { createRecurringExpense, updateRecurringExpense, deleteRecurringExpense, markRecurringReviewed } from "./actions";
import { FormSheet } from "./MoneyClient";

type RecurringExpense = Tables<"recurring_expenses">;
type Category = Tables<"categories">;

const FREQUENCIES = ["weekly", "monthly", "quarterly", "annual"] as const;
const REVIEW_STALE_DAYS = 90;

export function RecurringTab({ expenses, categories }: { expenses: RecurringExpense[]; categories: Category[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [, startTransition] = useTransition();

  const active = expenses.filter((e) => e.active);
  const flagged = active.filter((e) => needsReview(e));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-muted">Monthly recurring cost</p>
          <p data-sensitive className="tabular mt-1 text-lg font-semibold text-text">{formatZAR(recurringMonthlyCost(active))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Annual recurring cost</p>
          <p data-sensitive className="tabular mt-1 text-lg font-semibold text-text">{formatZAR(recurringAnnualCost(active))}</p>
        </div>
      </div>

      {flagged.length > 0 && (
        <section>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-soon">
            <AlertTriangle size={14} /> Subscriptions review ({flagged.length})
          </p>
          <div className="space-y-2">
            {flagged.map((e) => (
              <div key={e.id} className="card flex items-center justify-between gap-2 border-soon/40 bg-soon/5">
                <div>
                  <p className="text-sm text-text">{e.provider}</p>
                  <p className="text-xs text-muted">{reviewReason(e)}</p>
                </div>
                <button
                  onClick={() => startTransition(() => markRecurringReviewed(e.id))}
                  className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
                >
                  Still using it
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add recurring expense
      </button>

      {active.length === 0 ? (
        <EmptyState icon={RefreshCw} title="Nothing on the register" detail="Rent, insurance, streaming, mobile, gym — add your recurring commitments." />
      ) : (
        <div className="space-y-2">
          {active.map((e) => {
            const category = categories.find((c) => c.id === e.category_id);
            return (
              <div key={e.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">{e.provider}</p>
                  <p className="text-xs text-muted">
                    {e.frequency} {category && `· ${category.name}`}
                    {e.next_due_date && ` · next ${new Date(e.next_due_date).toLocaleDateString("en-ZA")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span data-sensitive className="tabular text-sm text-text">{formatZAR(Number(e.amount))}</span>
                  <button onClick={() => setEditing(e)} className="text-muted hover:text-text" aria-label="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => startTransition(() => deleteRecurringExpense(e.id))} className="text-muted hover:text-overdue" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <RecurringForm categories={categories} onClose={() => setShowForm(false)} />}
      {editing && <RecurringForm categories={categories} expense={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function needsReview(e: RecurringExpense) {
  if (e.contract_end_date) {
    const days = (new Date(e.contract_end_date).getTime() - Date.now()) / 86400000;
    if (days >= 0 && days <= 30) return true;
  }
  if (!e.last_reviewed_at) return true;
  const daysSince = (Date.now() - new Date(e.last_reviewed_at).getTime()) / 86400000;
  return daysSince > REVIEW_STALE_DAYS;
}

function reviewReason(e: RecurringExpense) {
  if (e.contract_end_date) {
    const days = Math.round((new Date(e.contract_end_date).getTime() - Date.now()) / 86400000);
    if (days >= 0 && days <= 30) return `Contract ends in ${days} day${days === 1 ? "" : "s"}`;
  }
  if (!e.last_reviewed_at) return "Never reviewed — still using this?";
  return `Not reviewed in over ${REVIEW_STALE_DAYS} days`;
}

function RecurringForm({ expense, categories, onClose }: { expense?: RecurringExpense; categories: Category[]; onClose: () => void }) {
  const [provider, setProvider] = useState(expense?.provider ?? "");
  const [categoryId, setCategoryId] = useState(expense?.category_id ?? "");
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>((expense?.frequency as (typeof FREQUENCIES)[number]) ?? "monthly");
  const [nextDue, setNextDue] = useState(expense?.next_due_date ?? "");
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method ?? "");
  const [contractEnd, setContractEnd] = useState(expense?.contract_end_date ?? "");
  const [cancellationNotice, setCancellationNotice] = useState(expense?.cancellation_notice_days?.toString() ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!provider.trim() || !amount) return;
    const fields = {
      provider: provider.trim(),
      category_id: categoryId || null,
      amount: Number(amount),
      frequency,
      next_due_date: nextDue || null,
      payment_method: paymentMethod.trim() || null,
      contract_end_date: contractEnd || null,
      cancellation_notice_days: cancellationNotice ? Number(cancellationNotice) : null,
      notes: notes.trim() || null,
    };
    startTransition(async () => {
      if (expense) await updateRecurringExpense(expense.id, fields);
      else await createRecurringExpense(fields);
      onClose();
    });
  }

  return (
    <FormSheet title={expense ? "Edit recurring expense" : "New recurring expense"} onClose={onClose}>
      <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider (e.g. Netflix)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <select value={frequency} onChange={(e) => setFrequency(e.target.value as (typeof FREQUENCIES)[number])} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
          {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        <option value="">No category</option>
        {categories.filter((c) => c.kind === "expense" && !c.hidden).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input value={nextDue} onChange={(e) => setNextDue(e.target.value)} type="date" placeholder="Next due" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Payment method" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} type="date" placeholder="Contract end" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={cancellationNotice} onChange={(e) => setCancellationNotice(e.target.value)} type="number" placeholder="Cancel notice (days)" className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">{expense ? "Save changes" : "Save recurring expense"}</button>
    </FormSheet>
  );
}
