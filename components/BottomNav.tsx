"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

export function BottomNav({ onOpenCapture }: { onOpenCapture: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 border-t border-border bg-surface/95 py-2 pl-1 pr-2 backdrop-blur lg:hidden">
      <div className="flex flex-1 items-center justify-between overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}
      </div>

      <button
        onClick={onOpenCapture}
        aria-label="Quick capture"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-accent/30 active:scale-95"
        style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))" }}
      >
        <Plus size={24} />
      </button>
    </nav>
  );
}

function NavLink({ item, active }: { item: (typeof NAV_ITEMS)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      style={{ color: active ? item.color : undefined }}
      className={clsx("flex shrink-0 flex-col items-center gap-0.5 px-2 py-1 text-[10px]", !active && "text-muted")}
    >
      <Icon size={19} style={active ? undefined : { color: item.color, opacity: 0.75 }} />
      {item.label.split(" ")[0]}
    </Link>
  );
}
