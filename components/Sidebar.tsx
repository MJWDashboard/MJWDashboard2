"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  BanknoteIcon,
  TrendingUp,
  CheckSquare,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileText,
  HardHat,
  Contact2,
  BarChart3,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/buildings", label: "Buildings", icon: Building2 },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/leasing", label: "Leasing", icon: Handshake },
  { href: "/arrears", label: "Arrears", icon: BanknoteIcon },
  { href: "/turnovers", label: "Turnovers", icon: TrendingUp },
  { href: "/actions", label: "Actions", icon: CheckSquare },
  { href: "/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/site-visits", label: "Site Visits", icon: ClipboardList },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/contractors", label: "Contractors", icon: HardHat },
  { href: "/contacts", label: "Contacts", icon: Contact2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-none flex-col border-r border-charcoal-700 bg-charcoal-900">
      <div className="flex h-16 items-center border-b border-charcoal-700 px-5">
        <span className="text-lg font-semibold text-charcoal-100">
          Vorexa <span className="text-cyan-400">Vault</span>
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-cyan-600/15 text-cyan-400"
                  : "text-charcoal-300 hover:bg-charcoal-800 hover:text-charcoal-100"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
