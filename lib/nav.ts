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
  /** Each module gets its own colour so the nav reads as more than one blue. */
  color: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: LayoutDashboard, color: "#007AFF" },
  { href: "/health", label: "Health", icon: HeartPulse, sensitive: true, color: "#FB7185" },
  { href: "/notes", label: "Notes & Lists", icon: StickyNote, color: "#FBBF24" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, color: "#A78BFA" },
  { href: "/money", label: "Money", icon: Wallet, color: "#34D399" },
  { href: "/vehicle", label: "Vehicle & Travel", icon: Car, color: "#FB923C" },
  { href: "/pets", label: "Home & Pets", icon: PawPrint, color: "#2DD4BF" },
  { href: "/vault", label: "Vault", icon: ShieldCheck, sensitive: true, color: "#818CF8" },
];
