"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Eye, EyeOff, ArrowUp, ArrowDown, Check, Pencil } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { renameCategory, setCategoryHidden, setCategoryBudgetGroup, reorderCategories } from "./actions";

type Category = Tables<"categories">;

const BUDGET_GROUPS = ["fixed", "flexible", "savings_debt"] as const;
const BUDGET_GROUP_LABEL: Record<string, string> = { fixed: "Fixed cost", flexible: "Flexible spending", savings_debt: "Savings / debt" };

/** Category management: rename, hide, reorder, and assign to a Flexible
 * Budget group (fixed / flexible / savings-debt) per the two budgeting
 * modes in the spec. */
export function CategoriesTab({ categories }: { categories: Category[] }) {
  const [order, setOrder] = useState(categories);
  const [, startTransition] = useTransition();

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    startTransition(() => reorderCategories(next.map((c) => c.id)));
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Rename, hide or reorder your categories, and group each one for the Flexible Budget view (fixed costs vs
        flexible spending vs savings/debt).
      </p>
      {(["expense", "income"] as const).map((kind) => (
        <section key={kind}>
          <p className="mb-2 text-sm font-medium capitalize text-text">{kind} categories</p>
          <div className="space-y-2">
            {order.filter((c) => c.kind === kind).length === 0 ? (
              <p className="text-xs text-muted">No {kind} categories yet — they're created from the Transactions tab.</p>
            ) : (
              order
                .filter((c) => c.kind === kind)
                .map((cat) => {
                  const index = order.findIndex((c) => c.id === cat.id);
                  return <CategoryRow key={cat.id} category={cat} onMove={(dir) => move(index, dir)} />;
                })
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function CategoryRow({ category, onMove }: { category: Category; onMove: (direction: -1 | 1) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [pending, startTransition] = useTransition();

  return (
    <div className={clsx("card space-y-2", category.hidden && "opacity-50")}>
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm text-text outline-none"
            />
            <button
              onClick={() => startTransition(async () => { await renameCategory(category.id, name.trim() || category.name); setEditing(false); })}
              disabled={pending}
              className="text-accent"
              aria-label="Save name"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-text">
            {category.name}
            <Pencil size={12} className="text-muted" />
          </button>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => onMove(-1)} className="text-muted hover:text-text" aria-label="Move up">
            <ArrowUp size={14} />
          </button>
          <button onClick={() => onMove(1)} className="text-muted hover:text-text" aria-label="Move down">
            <ArrowDown size={14} />
          </button>
          <button
            onClick={() => startTransition(() => setCategoryHidden(category.id, !category.hidden))}
            className="text-muted hover:text-text"
            aria-label={category.hidden ? "Unhide" : "Hide"}
          >
            {category.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      {category.kind === "expense" && (
        <select
          value={category.budget_group}
          onChange={(e) => startTransition(() => setCategoryBudgetGroup(category.id, e.target.value as (typeof BUDGET_GROUPS)[number]))}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-text"
        >
          {BUDGET_GROUPS.map((g) => (
            <option key={g} value={g}>{BUDGET_GROUP_LABEL[g]}</option>
          ))}
        </select>
      )}
    </div>
  );
}
