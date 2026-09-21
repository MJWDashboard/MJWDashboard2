import {
  LayoutDashboard,
  HeartPulse,
  StickyNote,
  CalendarDays,
  Wallet,
  Car,
  PawPrint,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Idle-locked per the architecture doc (15 min, sensitive data). */
  sensitive?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: LayoutDashboard },
  { href: "/health", label: "Health", icon: HeartPulse, sensitive: true },
  { href: "/notes", label: "Notes & Lists", icon: StickyNote },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/vehicle", label: "Vehicle & Travel", icon: Car },
  { href: "/pets", label: "Home & Pets", icon: PawPrint },
  { href: "/vault", label: "Vault", icon: ShieldCheck, sensitive: true },
];

// Mobile bottom bar surfaces the daily-use four; everything else lives
// behind "Life" so the bar stays five items wide including quick-capture.
export const MOBILE_PRIMARY = ["/today", "/health", "/money", "/vault"];
export const MOBILE_LIFE_HREFS = ["/calendar", "/notes", "/vehicle", "/pets"];
