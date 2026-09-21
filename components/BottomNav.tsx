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
  const primaryItems = NAV_ITEMS.filter((item) => MOBILE_PRIMARY.includes(item.href));
  const lifeActive = MOBILE_LIFE_HREFS.some((href) => pathname.startsWith(href));

  const [today, health, money, vault] = primaryItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-surface/95 py-2 backdrop-blur lg:hidden">
      <NavLink item={today} active={pathname.startsWith(today.href)} />
      <NavLink item={health} active={pathname.startsWith(health.href)} />

      <button
        onClick={onOpenCapture}
        aria-label="Quick capture"
        className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg"
      >
        <Plus size={26} />
      </button>

      <NavLink item={money} active={pathname.startsWith(money.href)} />

      <button
        onClick={onOpenLife}
        className={clsx(
          "flex flex-col items-center gap-0.5 px-3 text-xs",
          lifeActive ? "text-accent" : "text-muted"
        )}
      >
        <Menu size={20} />
        Life
      </button>

      <NavLink item={vault} active={pathname.startsWith(vault.href)} />
    </nav>
  );
}

function NavLink({ item, active }: { item: (typeof NAV_ITEMS)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex flex-col items-center gap-0.5 px-3 text-xs",
        active ? "text-accent" : "text-muted"
      )}
    >
      <Icon size={20} />
      {item.label.split(" ")[0]}
    </Link>
  );
}
