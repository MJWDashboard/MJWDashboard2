"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { Calculator } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { formatZAR } from "@/lib/money";
import { compareScenarios, type PayoffStrategy } from "@/lib/debtPayoff";

type Debt = Tables<"debts">;

const STRATEGIES: { key: PayoffStrategy; label: string; detail: string }[] = [
  { key: "avalanche", label: "Avalanche", detail: "Highest interest rate first — least total interest" },
  { key: "snowball", label: "Snowball", detail: "Smallest balance first — fastest early wins" },
  { key: "custom", label: "Current order", detail: "As listed below" },
];

export function PayoffSimulator({ debts }: { debts: Debt[] }) {
  const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche");
  const [extra, setExtra] = useState("500");

  const payoffDebts = useMemo(
    () =>
      debts.map((d) => ({
        id: d.id,
        creditor: d.creditor,
        balance: Number(d.balance),
        interestRate: d.interest_rate != null ? Number(d.interest_rate) : null,
        minimumPayment: d.minimum_payment != null ? Number(d.minimum_payment) : null,
      })),
    [debts]
  );

  const scenarios = useMemo(
    () => compareScenarios(payoffDebts, strategy, [Number(extra) || 0].filter((n) => n > 0)),
    [payoffDebts, strategy, extra]
  );

  return (
    <div className="card space-y-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-text">
        <Calculator size={14} /> Payoff simulator
      </p>

      <div className="flex gap-1">
        {STRATEGIES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStrategy(s.key)}
            className={clsx(
              "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium",
              strategy === s.key ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">{STRATEGIES.find((s) => s.key === strategy)?.detail}</p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Extra per month</span>
        <input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          type="number"
          className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs text-text outline-none focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        {scenarios.map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs">
            <span className="text-text">{s.label}</span>
            <div className="text-right">
              {s.result.feasible ? (
                <>
                  <p data-sensitive className="tabular text-text">
                    Debt-free {s.result.payoffDate ? new Date(s.result.payoffDate).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }) : "—"}
                  </p>
                  <p data-sensitive className="tabular text-muted">{formatZAR(s.result.totalInterest)} interest · {s.result.months}mo</p>
                </>
              ) : (
                <p className="text-overdue">Minimums don&apos;t cover interest</p>
              )}
            </div>
          </div>
        ))}
        {scenarios.length === 2 && scenarios[0].result.feasible && scenarios[1].result.feasible && (
          <p className="text-xs text-ok">
            {scenarios[0].result.months - scenarios[1].result.months} months sooner, {formatZAR(scenarios[0].result.totalInterest - scenarios[1].result.totalInterest)} less interest.
          </p>
        )}
      </div>
    </div>
  );
}
