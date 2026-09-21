"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/lib/nav";
import { SignOutButton } from "./SignOutButton";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 p-4 lg:flex">
      <div className="mb-6 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Vorexa</p>
        <p className="text-sm font-semibold text-text">Personal Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:bg-surface hover:text-text"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <SignOutButton />
    </aside>
  );
}
