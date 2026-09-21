"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NAV_ITEMS } from "@/lib/nav";
import { SignOutButton } from "./SignOutButton";
import { Wordmark } from "./Wordmark";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 p-4 lg:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <Image src="/brand/mark.png" alt="" width={28} height={28} priority />
        <div>
          <Wordmark width={90} />
          <p className="mt-0.5 text-xs text-muted">Personal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={active ? { backgroundColor: `${item.color}22`, color: item.color } : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                !active && "text-muted hover:bg-surface hover:text-text"
              )}
            >
              <Icon size={18} style={active ? undefined : { color: item.color, opacity: 0.85 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <SignOutButton />
    </aside>
  );
}
