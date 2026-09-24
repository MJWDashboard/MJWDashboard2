"use client";

import { useTransition } from "react";
import { TrendingUp, Save } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { calculateNetWorth, formatZAR } from "@/lib/money";
import { saveNetWorthSnapshot } from "./actions";

type Account = Tables<"accounts">;
type Transaction = Tables<"transactions">;
type Debt = Tables<"debts">;
type SavingsGoal = Tables<"savings_goals">;
type NetWorthSnapshot = Tables<"net_worth_snapshots">;

export function NetWorthTab({
  accounts,
  transactions,
  debts,
  savingsGoals,
  snapshots,
  month,
}: {
  accounts: Account[];
  transactions: Transaction[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  snapshots: NetWorthSnapshot[];
  month: string;
}) {
  const [pending, startTransition] = useTransition();
  const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(accounts, transactions, debts, savingsGoals);
  const currentSnapshot = snapshots.find((s) => s.snapshot_month === month);
  const previousSnapshot = snapshots.find((s) => s.snapshot_month !== month);
  const change = previousSnapshot ? netWorth - Number(previousSnapshot.net_worth) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs text-muted">Assets</p>
          <p data-sensitive className="tabular mt-1 text-lg font-semibold text-ok">{formatZAR(totalAssets)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Liabilities</p>
          <p data-sensitive className="tabular mt-1 text-lg font-semibold text-overdue">{formatZAR(totalLiabilities)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Net worth</p>
          <p data-sensitive className="tabular mt-1 text-lg font-semibold text-text">{formatZAR(netWorth)}</p>
        </div>
      </div>

      {change !== null && (
        <p className={change >= 0 ? "flex items-center gap-1 text-sm text-ok" : "flex items-center gap-1 text-sm text-overdue"}>
          <TrendingUp size={14} />
          {change >= 0 ? "+" : ""}
          {formatZAR(change)} since last snapshot
        </p>
      )}

      <button
        onClick={() => startTransition(() => saveNetWorthSnapshot(month, totalAssets, totalLiabilities))}
        disabled={pending}
        className="btn-secondary w-full"
      >
        <Save size={14} /> {currentSnapshot ? "Update this month's snapshot" : "Save this month's snapshot"}
      </button>

      {snapshots.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-medium text-text">History</p>
          <div className="space-y-1.5">
            {snapshots.map((s) => (
              <div key={s.id} className="card flex items-center justify-between text-sm">
                <span className="text-muted">{s.snapshot_month}</span>
                <span data-sensitive className="tabular text-text">{formatZAR(Number(s.net_worth))}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-muted">
        Assets: cash, savings and investment account balances plus savings goal progress. Liabilities: active debts
        plus credit card / loan / store account / tax / other-liability balances. No property or vehicle valuations
        yet — those modules don&apos;t carry a value field.
      </p>
    </div>
  );
}
