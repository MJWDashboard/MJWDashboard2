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
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/buildings", label: "Buildings", icon: Building2 },
  { href: "/dashboard/tenants", label: "Tenants", icon: Users },
  { href: "/dashboard/leasing", label: "Leasing", icon: Handshake },
  { href: "/dashboard/arrears", label: "Arrears", icon: BanknoteIcon },
  { href: "/dashboard/turnovers", label: "Turnovers", icon: TrendingUp },
  { href: "/dashboard/actions", label: "Actions", icon: CheckSquare },
  { href: "/dashboard/meetings", label: "Meetings", icon: CalendarClock },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/site-visits", label: "Site Visits", icon: ClipboardList },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/contractors", label: "Contractors", icon: HardHat },
  { href: "/dashboard/contacts", label: "Contacts", icon: Contact2 },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: BookOpen },
];

export function Sidebar({ canAccessTeam }: { canAccessTeam: boolean }) {
  const pathname = usePathname();

  const items = canAccessTeam
    ? [...NAV_ITEMS, { href: "/dashboard/team", label: "Team & Access", icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <aside className="flex h-screen w-60 flex-none flex-col border-r border-charcoal-700 bg-charcoal-900">
      <div className="flex h-16 items-center border-b border-charcoal-700 px-5">
        <Link href="/dashboard">
          <Logo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
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
