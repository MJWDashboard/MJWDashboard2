import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  HeartPulse,
  Wallet,
  Target,
  Compass,
  StickyNote,
  ShieldCheck,
  LineChart,
  Settings as SettingsIcon,
  PawPrint,
  Car,
  House,
  Plane,
  Inbox,
  ClipboardList,
  Sparkles,
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

/** The full module list — every real route in the app. Individual module
 * pages look themselves up here by href (for PageHeader's icon/colour), so
 * every href that used to exist must keep existing here even as the nav
 * groupings below change around it. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/today", label: "Today", icon: LayoutDashboard, color: CORE_TEAL },
  { href: "/plan", label: "Plan", icon: ListTodo, color: CORE_TEAL },
  { href: "/inbox", label: "Inbox", icon: Inbox, color: CORE_TEAL },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, color: CORE_TEAL },
  { href: "/health", label: "Wellness", icon: HeartPulse, sensitive: true, color: CORE_TEAL },
  { href: "/money", label: "Money", icon: Wallet, color: CORE_TEAL },
  { href: "/goals", label: "Goals", icon: Target, color: CORE_TEAL },
  { href: "/life", label: "Life", icon: Compass, color: CORE_TEAL },
  { href: "/life-admin", label: "Life Admin", icon: ClipboardList, color: CORE_TEAL },
  { href: "/home", label: "Home", icon: House, color: CORE_TEAL },
  { href: "/pets", label: "Home & Pets", icon: PawPrint, color: CORE_TEAL },
  { href: "/vehicle", label: "Vehicle & Travel", icon: Car, color: CORE_TEAL },
  { href: "/travel", label: "Travel", icon: Plane, color: CORE_TEAL },
  { href: "/notes", label: "Notes & Lists", icon: StickyNote, color: CORE_TEAL },
  { href: "/vault", label: "Vault", icon: ShieldCheck, sensitive: true, color: CORE_TEAL },
  { href: "/insights", label: "Insights", icon: LineChart, color: CORE_TEAL },
  { href: "/assistant", label: "Core Assistant", icon: Sparkles, color: CORE_TEAL },
  { href: "/settings", label: "Settings", icon: SettingsIcon, color: CORE_TEAL },
];

function pick(...hrefs: string[]) {
  return hrefs.map((href) => NAV_ITEMS.find((n) => n.href === href)!);
}

/** Desktop sidebar, in order, per the v2 information architecture. */
export const SIDEBAR_ITEMS = pick("/today", "/plan", "/inbox", "/calendar", "/health", "/money", "/goals", "/life", "/notes", "/vault", "/insights", "/assistant", "/settings");

/** Mobile bottom bar: Today / Plan / Add / Money / More. "Add" and "More"
 * are actions rendered by BottomNav itself, not routes. */
export const BOTTOM_NAV_ITEMS = pick("/today", "/plan", "/money");

/** Mobile "More" sheet — every other module, flat (not grouped under Life). */
export const MORE_SHEET_ITEMS = pick("/inbox", "/health", "/goals", "/life-admin", "/home", "/pets", "/vehicle", "/travel", "/notes", "/vault", "/insights", "/assistant", "/settings");

/** Cards on the Life hub page (desktop's stand-in for the flat mobile list). */
export const LIFE_HUB_ITEMS = pick("/life-admin", "/home", "/pets", "/vehicle", "/travel");
