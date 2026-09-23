"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { SIDEBAR_ITEMS } from "@/lib/nav";
import { SignOutButton } from "./SignOutButton";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col bg-[rgb(var(--color-navy))] p-4 lg:flex">
      <div className="mb-6 px-2">
        {/* Sidebar is always dark navy regardless of app theme, so it always
            needs the white-on-dark wordmark, not the theme-switching one. */}
        <Image src="/brand/wordmark-light.png" alt="Vorexa Core" width={130} height={43} priority />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors",
                active ? "bg-accent/20 text-accent-2" : "text-white/60 hover:bg-white/5 hover:text-white"
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
