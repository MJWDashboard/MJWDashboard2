"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { BOTTOM_NAV_ITEMS, MORE_SHEET_ITEMS } from "@/lib/nav";

export function BottomNav({ onOpenCapture }: { onOpenCapture: () => void }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_SHEET_ITEMS.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-border bg-surface/95 px-2 py-1.5 backdrop-blur lg:hidden">
        {BOTTOM_NAV_ITEMS.slice(0, 2).map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}

        <button
          onClick={onOpenCapture}
          aria-label="Quick capture"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-white shadow-lg active:scale-95"
        >
          <Plus size={24} />
        </button>

        {BOTTOM_NAV_ITEMS.slice(2).map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}

        <button
          onClick={() => setMoreOpen(true)}
          className={clsx("flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium", moreActive ? "text-accent" : "text-muted")}
        >
          <Menu size={22} />
          <span className="leading-none">More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="w-full rounded-t-2xl border-t border-border bg-surface p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text">More</p>
              <button onClick={() => setMoreOpen(false)} aria-label="Close" className="text-muted hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MORE_SHEET_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center"
                >
                  <item.icon size={20} className="text-accent" />
                  <span className="text-xs text-text">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ item, active }: { item: (typeof BOTTOM_NAV_ITEMS)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium",
        active ? "text-accent" : "text-muted"
      )}
    >
      <Icon size={22} />
      <span className="leading-none">{item.label.split(" ")[0]}</span>
    </Link>
  );
}
