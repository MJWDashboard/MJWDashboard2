const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Vercel's server functions and a visitor's browser can carry different ICU
// data (Node vs the browser's own build), so the same Intl call can print a
// different thousands separator or month abbreviation ("Sept" vs "Sep") on
// each side - producing a React hydration mismatch. These formatters avoid
// that entirely by grouping digits and naming months ourselves instead of
// leaning on locale data, so server and client always render byte-identical
// text. Times are pinned to Africa/Johannesburg so the displayed hour is
// also independent of which timezone the server or browser happens to run in.

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}R ${groupThousands(Math.abs(rounded).toString())}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}${groupThousands(Math.abs(rounded).toString())}`;
}

function johannesburgDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  // Date-only values (e.g. "2026-09-18") are UTC midnight; reading the UTC
  // calendar fields keeps the day shown identical to what was stored,
  // regardless of the rendering host's local timezone.
  const monthName = MONTHS[date.getUTCMonth()];
  return `${String(date.getUTCDate()).padStart(2, "0")} ${monthName} ${date.getUTCFullYear()}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const { year, month, day, hour, minute } = johannesburgDateParts(date);
  const monthName = MONTHS[Number(month) - 1];
  return `${day} ${monthName} ${year}, ${hour}:${minute}`;
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
