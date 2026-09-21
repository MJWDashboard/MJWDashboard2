"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { NAV_ITEMS, MOBILE_LIFE_HREFS } from "@/lib/nav";

export function LifeSheet({ onClose }: { onClose: () => void }) {
  const items = NAV_ITEMS.filter((item) => MOBILE_LIFE_HREFS.includes(item.href));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:hidden">
      <div className="w-full max-w-md rounded-t-2xl border border-border bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-text">Life</p>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="card flex flex-col items-center gap-2 py-5 text-sm text-text"
              >
                <Icon size={22} className="text-accent" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
