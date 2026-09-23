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
  /** One brand active colour per the Vorexa interface language spec — module
   * identity comes from the icon and label only, not from unrelated hues. */
  color: string;
};

const CORE_TEAL = "#0FAE9C";

export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: LayoutDashboard, color: CORE_TEAL },
  { href: "/health", label: "Health", icon: HeartPulse, sensitive: true, color: CORE_TEAL },
  { href: "/notes", label: "Notes & Lists", icon: StickyNote, color: CORE_TEAL },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, color: CORE_TEAL },
  { href: "/money", label: "Money", icon: Wallet, color: CORE_TEAL },
  { href: "/vehicle", label: "Vehicle & Travel", icon: Car, color: CORE_TEAL },
  { href: "/pets", label: "Home & Pets", icon: PawPrint, color: CORE_TEAL },
  { href: "/vault", label: "Vault", icon: ShieldCheck, sensitive: true, color: CORE_TEAL },
];
