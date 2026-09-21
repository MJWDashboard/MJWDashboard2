"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

export function BottomNav({ onOpenCapture }: { onOpenCapture: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-surface/95 px-2 py-1.5 backdrop-blur lg:hidden">
      <div className="grid flex-1 grid-cols-8">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}
      </div>

      <button
        onClick={onOpenCapture}
        aria-label="Quick capture"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-accent text-white shadow-sm active:scale-95"
      >
        <Plus size={22} />
      </button>
    </nav>
  );
}

function NavLink({ item, active }: { item: (typeof NAV_ITEMS)[number]; active: boolean }) {
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
