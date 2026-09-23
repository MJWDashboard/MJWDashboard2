export type PayoffDebt = {
  id: string;
  creditor: string;
  balance: number;
  interestRate: number | null; // annual %
  minimumPayment: number | null;
};

export type PayoffStrategy = "snowball" | "avalanche" | "custom";

const MAX_MONTHS = 600; // 50 years — a safety cap, not a realistic outcome

export function orderDebts(debts: PayoffDebt[], strategy: PayoffStrategy, customOrder?: string[]): PayoffDebt[] {
  if (strategy === "snowball") return [...debts].sort((a, b) => a.balance - b.balance);
  if (strategy === "avalanche") return [...debts].sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0));
  if (customOrder) {
    return [...debts].sort((a, b) => customOrder.indexOf(a.id) - customOrder.indexOf(b.id));
  }
  return debts;
}

export type PayoffResult = {
  months: number;
  totalInterest: number;
  payoffDate: string | null;
  feasible: boolean;
};

/** Rolls minimum payments plus a fixed extra-per-month amount down the debt
 * priority order (snowball/avalanche/custom): once a debt is cleared, its
 * minimum payment joins the extra pool for the next debt in line. Standard
 * debt-payoff-calculator math — no compounding surprises, just monthly
 * simple interest accrual on the declining balance. */
export function simulatePayoff(debts: PayoffDebt[], strategy: PayoffStrategy, extraMonthly = 0, customOrder?: string[]): PayoffResult {
  const ordered = orderDebts(debts, strategy, customOrder).map((d) => ({ ...d, remaining: d.balance }));
  if (ordered.length === 0) return { months: 0, totalInterest: 0, payoffDate: new Date().toISOString().slice(0, 10), feasible: true };

  let totalInterest = 0;
  let month = 0;
  let pool = extraMonthly;

  while (ordered.some((d) => d.remaining > 0.01) && month < MAX_MONTHS) {
    month += 1;
    let freed = 0;

    for (const d of ordered) {
      if (d.remaining <= 0.01) continue;
      const monthlyRate = (d.interestRate ?? 0) / 100 / 12;
      const interest = d.remaining * monthlyRate;
      totalInterest += interest;
      d.remaining += interest;
    }

    let available = pool;
    for (const d of ordered) {
      if (d.remaining <= 0.01) continue;
      // No minimum on file — fall back to a nominal 2% of balance rather
      // than treating "unspecified" as "pay it off this month".
      const nominalMinimum = d.minimumPayment ?? Math.max(100, d.remaining * 0.02);
      const minPay = Math.min(nominalMinimum, d.remaining);
      d.remaining -= minPay;
      if (d.remaining <= 0.01) {
        freed += nominalMinimum;
        d.remaining = 0;
      }
    }

    for (const d of ordered) {
      if (available <= 0) break;
      if (d.remaining <= 0.01) continue;
      const extra = Math.min(available, d.remaining);
      d.remaining -= extra;
      available -= extra;
    }

    pool += freed;
  }

  const feasible = ordered.every((d) => d.remaining <= 0.01);
  const payoffDate = feasible ? monthsFromNow(month) : null;
  return { months: month, totalInterest: Math.round(totalInterest), payoffDate, feasible };
}

function monthsFromNow(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export type PayoffScenario = { label: string; extraMonthly: number; result: PayoffResult };

/** Scenario comparison: current minimums-only vs one or more "+extra" amounts. */
export function compareScenarios(debts: PayoffDebt[], strategy: PayoffStrategy, extras: number[], customOrder?: string[]): PayoffScenario[] {
  return [0, ...extras].map((extra) => ({
    label: extra === 0 ? "Current (minimums only)" : `+R${extra.toLocaleString("en-ZA")}/month`,
    extraMonthly: extra,
    result: simulatePayoff(debts, strategy, extra, customOrder),
  }));
}
