"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Menu } from "lucide-react";
import { clsx } from "clsx";
import { NAV_ITEMS, MOBILE_PRIMARY, MOBILE_LIFE_HREFS } from "@/lib/nav";

export function BottomNav({
  onOpenCapture,
  onOpenLife,
}: {
  onOpenCapture: () => void;
  onOpenLife: () => void;
}) {
  const pathname = usePathname();
  const [today, health, money, vault] = MOBILE_PRIMARY.map(
    (href) => NAV_ITEMS.find((item) => item.href === href)!
  );
  const lifeActive = MOBILE_LIFE_HREFS.some((href) => pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-1 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur lg:hidden">
      <div className="flex flex-1 items-center justify-around">
        <NavLink item={today} active={pathname.startsWith(today.href)} />
        <NavLink item={health} active={pathname.startsWith(health.href)} />
        <NavLink item={money} active={pathname.startsWith(money.href)} />
        <button
          onClick={onOpenLife}
          className={clsx(
            "flex flex-col items-center gap-0.5 px-2.5 py-1 text-xs",
            lifeActive ? "text-accent" : "text-muted"
          )}
        >
          <Menu size={20} />
          Life
        </button>
        <NavLink item={vault} active={pathname.startsWith(vault.href)} />
      </div>

      <button
        onClick={onOpenCapture}
        aria-label="Quick capture"
        className="ml-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-accent/30 active:scale-95"
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
      className={clsx(
        "flex flex-col items-center gap-0.5 px-2.5 py-1 text-xs",
        active ? "text-accent" : "text-muted"
      )}
    >
      <Icon size={20} />
      {item.label.split(" ")[0]}
    </Link>
  );
}
