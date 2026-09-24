"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Fuel, Receipt, CreditCard, X } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { triageFuelCapture, triageExpenseCapture, triageDebtPaymentCapture, dismissCapture } from "@/lib/quickCaptureServer";

type Capture = Tables<"quick_captures">;

export function InboxCard({
  captures,
  vehicles,
  accounts,
  debts,
}: {
  captures: Capture[];
  vehicles: { id: string; make: string; model: string }[];
  accounts: { id: string; name: string }[];
  debts: { id: string; creditor: string }[];
}) {
  return (
    <div className="space-y-2">
      {captures.map((capture) => {
        if (capture.type === "fuel") return <FuelCapture key={capture.id} capture={capture} vehicles={vehicles} />;
        if (capture.type === "debt_payment") return <DebtPaymentCapture key={capture.id} capture={capture} debts={debts} />;
        return <ExpenseCapture key={capture.id} capture={capture} accounts={accounts} />;
      })}
    </div>
  );
}

function CaptureShell({
  icon: Icon,
  title,
  detail,
  onDismiss,
  children,
}: {
  icon: typeof Fuel;
  title: string;
  detail: string;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-accent" />
          <div>
            <p className="text-sm font-medium text-text">{title}</p>
            <p className="text-xs text-muted">{detail}</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-muted hover:text-overdue" aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  );
}

function FuelCapture({ capture, vehicles }: { capture: Capture; vehicles: { id: string; make: string; model: string }[] }) {
  const router = useRouter();
  const payload = capture.payload as { total?: number; note?: string };
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [litres, setLitres] = useState("");
  const [odometer, setOdometer] = useState("");
  const [fullTank, setFullTank] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!vehicleId || !litres || !odometer) {
      setError("Pick a vehicle and fill in litres and odometer");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await triageFuelCapture(capture.id, {
        vehicle_id: vehicleId,
        litres: Number(litres),
        odometer: Number(odometer),
        full_tank: fullTank,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function dismiss() {
    startTransition(async () => {
      await dismissCapture(capture.id);
      router.refresh();
    });
  }

  if (vehicles.length === 0) {
    return (
      <CaptureShell icon={Fuel} title={`Fuel — R${payload.total ?? 0}`} detail="Add a vehicle first to file this" onDismiss={dismiss}>
        <p className="text-xs text-muted">No vehicles yet — add one in Vehicle & Travel, then come back to file this.</p>
      </CaptureShell>
    );
  }

  return (
    <CaptureShell
      icon={Fuel}
      title={`Fuel — R${payload.total ?? 0}`}
      detail={payload.note ? payload.note : "Pick a vehicle to file this fill-up"}
      onDismiss={dismiss}
    >
      <div className="flex gap-2">
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.make} {v.model}</option>
          ))}
        </select>
        <input
          value={litres}
          onChange={(e) => setLitres(e.target.value)}
          type="number"
          placeholder="Litres"
          className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <input
        value={odometer}
        onChange={(e) => setOdometer(e.target.value)}
        type="number"
        placeholder="Odometer (km)"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={fullTank} onChange={(e) => setFullTank(e.target.checked)} />
        Filled to full
      </label>
      {error && <p className="text-xs text-overdue">{error}</p>}
      <button onClick={save} disabled={pending} className="btn-primary w-full text-sm">
        {pending ? "Saving..." : "File fill-up"}
      </button>
    </CaptureShell>
  );
}

function ExpenseCapture({ capture, accounts }: { capture: Capture; accounts: { id: string; name: string }[] }) {
  const router = useRouter();
  const payload = capture.payload as { amount?: number; note?: string };
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!accountId) {
      setError("Pick an account");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await triageExpenseCapture(capture.id, { account_id: accountId, category_id: null });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function dismiss() {
    startTransition(async () => {
      await dismissCapture(capture.id);
      router.refresh();
    });
  }

  if (accounts.length === 0) {
    return (
      <CaptureShell icon={Receipt} title={`Expense — R${payload.amount ?? 0}`} detail="Add an account first to file this" onDismiss={dismiss}>
        <p className="text-xs text-muted">No accounts yet — add one in Money, then come back to file this.</p>
      </CaptureShell>
    );
  }

  return (
    <CaptureShell
      icon={Receipt}
      title={`Expense — R${payload.amount ?? 0}`}
      detail={payload.note ? payload.note : "Pick an account to file this"}
      onDismiss={dismiss}
    >
      <select
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text"
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      {error && <p className="text-xs text-overdue">{error}</p>}
      <button onClick={save} disabled={pending} className="btn-primary w-full text-sm">
        {pending ? "Saving..." : "File expense"}
      </button>
    </CaptureShell>
  );
}

function DebtPaymentCapture({ capture, debts }: { capture: Capture; debts: { id: string; creditor: string }[] }) {
  const router = useRouter();
  const payload = capture.payload as { amount?: number; note?: string };
  const [debtId, setDebtId] = useState(debts[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!debtId) {
      setError("Pick which debt this pays off");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await triageDebtPaymentCapture(capture.id, { debt_id: debtId });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function dismiss() {
    startTransition(async () => {
      await dismissCapture(capture.id);
      router.refresh();
    });
  }

  if (debts.length === 0) {
    return (
      <CaptureShell icon={CreditCard} title={`Debt payment — R${payload.amount ?? 0}`} detail="Add a debt first to file this" onDismiss={dismiss}>
        <p className="text-xs text-muted">No debts on file yet — add one in Money, then come back to file this.</p>
      </CaptureShell>
    );
  }

  return (
    <CaptureShell
      icon={CreditCard}
      title={`Debt payment — R${payload.amount ?? 0}`}
      detail={payload.note ? payload.note : "Pick which debt this pays off"}
      onDismiss={dismiss}
    >
      <select
        value={debtId}
        onChange={(e) => setDebtId(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text"
      >
        {debts.map((d) => (
          <option key={d.id} value={d.id}>{d.creditor}</option>
        ))}
      </select>
      {error && <p className="text-xs text-overdue">{error}</p>}
      <button onClick={save} disabled={pending} className="btn-primary w-full text-sm">
        {pending ? "Saving..." : "File payment"}
      </button>
    </CaptureShell>
  );
}
