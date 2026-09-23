"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Fuel, Receipt, Scale, StickyNote, ShoppingCart, ListTodo, CalendarClock, Bell, CreditCard } from "lucide-react";
import { clsx } from "clsx";
import { queueQuickCapture } from "@/lib/quickCapture";
import { parseCaptureSmart } from "@/lib/captureParserAI";
import type { CaptureKind } from "@/lib/captureParser";

const KIND_META: Record<CaptureKind, { label: string; icon: typeof Fuel }> = {
  task: { label: "Task", icon: ListTodo },
  expense: { label: "Expense", icon: Receipt },
  note: { label: "Note", icon: StickyNote },
  appointment: { label: "Appointment", icon: CalendarClock },
  reminder: { label: "Reminder", icon: Bell },
  shopping_item: { label: "Shopping", icon: ShoppingCart },
  debt_payment: { label: "Debt payment", icon: CreditCard },
  weight: { label: "Weight", icon: Scale },
  fuel: { label: "Fuel", icon: Fuel },
  vehicle_expense: { label: "Vehicle", icon: Fuel },
  pet_expense: { label: "Pet", icon: Fuel },
  general: { label: "Note", icon: StickyNote },
};
const QUICK_KINDS: CaptureKind[] = ["task", "expense", "note", "appointment", "reminder", "shopping_item", "debt_payment", "weight", "fuel"];

export function QuickCaptureSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedFromAI, setParsedFromAI] = useState(false);
  const [kind, setKind] = useState<CaptureKind>("task");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [priority, setPriority] = useState<"critical" | "high" | "normal" | "low">("normal");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  async function handleParse() {
    if (!rawText.trim()) return;
    setParsing(true);
    const result = await parseCaptureSmart(rawText.trim());
    setKind(result.kind);
    setTitle(result.title);
    setAmount(result.amount != null ? String(result.amount) : "");
    setDate(result.date ?? "");
    setTime(result.time ?? "");
    setRecurrence(result.recurrence);
    setPriority(result.priority);
    setParsedFromAI(result.source === "ai");
    setParsing(false);
    setReviewing(true);
  }

  function pickKindManually(k: CaptureKind) {
    setKind(k);
    if (!reviewing) {
      setTitle(rawText);
      setReviewing(true);
    }
  }

  function buildPayload(): Record<string, unknown> {
    switch (kind) {
      case "task":
        return { title, due_date: date || null, due_time: time || null, priority, recurrence };
      case "appointment":
      case "reminder":
        return { title, due_date: date || null, due_time: time || null };
      case "note":
      case "general":
        return { text: title };
      case "shopping_item":
        return { item: title };
      case "weight":
        return { kg: Number(amount) };
      case "expense":
      case "fuel":
      case "debt_payment":
        return { amount: Number(amount), total: Number(amount), note: title };
      default:
        return { text: title };
    }
  }

  async function handleSave() {
    setSaving(true);
    await queueQuickCapture(kind, buildPayload());
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => {
      setRawText("");
      setTitle("");
      setAmount("");
      setDate("");
      setTime("");
      setReviewing(false);
      setSaved(false);
      onClose();
    }, 500);
  }

  const needsAmount = kind === "expense" || kind === "fuel" || kind === "weight" || kind === "debt_payment";
  const needsDate = kind === "task" || kind === "appointment" || kind === "reminder";
  const canSave = title.trim() && (!needsAmount || amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Quick capture</p>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        {!reviewing ? (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleParse()}
                placeholder='Type anything — "Pay ABSA card R2,000 Friday"'
                autoFocus
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-3 pr-9 text-sm text-text outline-none focus:border-accent"
              />
              <Sparkles size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            </div>
            <button onClick={handleParse} disabled={!rawText.trim() || parsing} className="btn-primary w-full">
              {parsing ? "Reading..." : "Continue"}
            </button>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {QUICK_KINDS.map((k) => {
                const meta = KIND_META[k];
                return (
                  <button
                    key={k}
                    onClick={() => pickKindManually(k)}
                    className="flex flex-col items-center gap-1 rounded-md py-2 text-[11px] text-muted hover:bg-background"
                  >
                    <meta.icon size={16} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {QUICK_KINDS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-xs",
                      kind === k ? "bg-accent text-white" : "bg-background text-muted"
                    )}
                  >
                    {KIND_META[k].label}
                  </button>
                ))}
              </div>
            </div>
            {parsedFromAI && (
              <p className="flex items-center gap-1 text-xs text-accent-2">
                <Sparkles size={12} /> Parsed — check the details before saving
              </p>
            )}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
            />

            {needsAmount && (
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={kind === "weight" ? "Weight (kg)" : "Amount (R)"}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
              />
            )}

            {needsDate && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
                />
              </div>
            )}

            {kind === "task" && (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text"
                >
                  {(["critical", "high", "normal", "low"] as const).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text"
                >
                  {(["none", "daily", "weekly", "monthly"] as const).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            <button onClick={handleSave} disabled={saving || !canSave} className="btn-primary w-full">
              {saved ? "Saved" : saving ? "Saving..." : "Save"}
            </button>
            <p className="text-center text-xs text-muted">
              {kind === "fuel" || kind === "expense" || kind === "debt_payment"
                ? "Lands in your Today inbox to pick a vehicle/account/debt, then it's a real record."
                : "Filed automatically — saved offline if you're not connected."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
