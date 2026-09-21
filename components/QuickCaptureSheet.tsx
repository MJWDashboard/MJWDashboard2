"use client";

import { useState } from "react";
import { X, Fuel, Receipt, Scale, StickyNote, ShoppingCart } from "lucide-react";
import { clsx } from "clsx";
import { queueQuickCapture } from "@/lib/quickCapture";

type CaptureType = "fuel" | "expense" | "weight" | "note" | "shopping_item";

const TABS: { type: CaptureType; label: string; icon: typeof Fuel }[] = [
  { type: "fuel", label: "Fuel", icon: Fuel },
  { type: "expense", label: "Expense", icon: Receipt },
  { type: "weight", label: "Weight", icon: Scale },
  { type: "note", label: "Note", icon: StickyNote },
  { type: "shopping_item", label: "Shopping", icon: ShoppingCart },
];

export function QuickCaptureSheet({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<CaptureType>("note");
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    if (type === "note") payload.text = text;
    if (type === "shopping_item") payload.item = text;
    if (type === "expense") { payload.amount = Number(amount); payload.note = text; }
    if (type === "fuel") { payload.total = Number(amount); payload.note = text; }
    if (type === "weight") payload.kg = Number(amount);

    await queueQuickCapture(type, payload);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setText("");
      setAmount("");
      setSaved(false);
      onClose();
    }, 500);
  }

  const needsAmount = type === "expense" || type === "fuel" || type === "weight";
  const needsText = type !== "weight";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-surface p-4 lg:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Quick capture</p>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-5 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.type}
                onClick={() => setType(tab.type)}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-md py-2 text-xs",
                  type === tab.type ? "bg-accent/15 text-accent" : "text-muted hover:bg-background"
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {needsAmount && (
            <input
              type="number"
              inputMode="decimal"
              placeholder={type === "weight" ? "Weight (kg)" : "Amount (R)"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
              autoFocus
            />
          )}
          {needsText && (
            <input
              type="text"
              placeholder={type === "note" ? "Note" : type === "shopping_item" ? "Item" : "Detail (optional)"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
              autoFocus={!needsAmount}
            />
          )}
          <button
            onClick={handleSave}
            disabled={saving || (needsAmount && !amount) || (type === "note" && !text) || (type === "shopping_item" && !text)}
            className="btn-primary w-full"
          >
            {saved ? "Saved" : saving ? "Saving..." : "Save"}
          </button>
          <p className="text-center text-xs text-muted">
            Saved offline if you&apos;re not connected — it syncs automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
