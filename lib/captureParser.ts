import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { SAST } from "@/lib/timezone";

export type CaptureKind =
  | "task"
  | "expense"
  | "note"
  | "appointment"
  | "reminder"
  | "shopping_item"
  | "debt_payment"
  | "weight"
  | "fuel"
  | "vehicle_expense"
  | "pet_expense"
  | "general"
  | "mood";

export type ParsedCapture = {
  /** Text with the recognised date/time/amount fragments stripped out. */
  title: string;
  kind: CaptureKind;
  amount: number | null;
  /** ISO date, e.g. 2026-09-30. */
  date: string | null;
  /** 24h HH:mm. */
  time: string | null;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  priority: "critical" | "high" | "normal" | "low";
  source: "rules" | "ai";
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function todayZoned() {
  const d = toZonedTime(new Date(), SAST);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extractAmount(text: string): { amount: number | null; rest: string } {
  const match = text.match(/\bR\s?(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{1,2})?)\b/i);
  if (!match) return { amount: null, rest: text };
  const amount = Number(match[1].replace(/[,\s]/g, ""));
  return { amount: Number.isFinite(amount) ? amount : null, rest: text.replace(match[0], "").trim() };
}

function extractTime(text: string): { time: string | null; rest: string } {
  const match = text.match(/\b(\d{1,2})[:h](\d{2})\s?(am|pm)?\b/i) ?? text.match(/\b(\d{1,2})\s?(am|pm)\b/i);
  if (!match) return { time: null, rest: text };
  let hour = Number(match[1]);
  const minute = match[2] && /^\d+$/.test(match[2]) ? Number(match[2]) : 0;
  const meridiem = (match[3] ?? match[2] ?? "").toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { time, rest: text.replace(match[0], "").trim() };
}

function extractRecurrence(text: string): { recurrence: ParsedCapture["recurrence"]; rest: string } {
  const patterns: [RegExp, ParsedCapture["recurrence"]][] = [
    [/\bevery\s+day\b|\bdaily\b/i, "daily"],
    [/\bevery\s+week\b|\bweekly\b/i, "weekly"],
    [/\bevery\s+month\b|\bmonthly\b/i, "monthly"],
  ];
  for (const [re, recurrence] of patterns) {
    const match = text.match(re);
    if (match) return { recurrence, rest: text.replace(match[0], "").trim() };
  }
  return { recurrence: "none", rest: text };
}

function extractDate(text: string): { date: string | null; rest: string } {
  const today = todayZoned();

  let match = text.match(/\btoday\b/i);
  if (match) return { date: toISODate(today), rest: text.replace(match[0], "").trim() };

  match = text.match(/\btomorrow\b/i);
  if (match) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return { date: toISODate(d), rest: text.replace(match[0], "").trim() };
  }

  match = text.match(/\bin\s+(\d+)\s+days?\b/i);
  if (match) {
    const d = new Date(today);
    d.setDate(d.getDate() + Number(match[1]));
    return { date: toISODate(d), rest: text.replace(match[0], "").trim() };
  }

  // "Friday" / "this Friday" / "next Friday"
  match = text.match(/\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (match) {
    const targetDow = WEEKDAYS.indexOf(match[2].toLowerCase());
    const d = new Date(today);
    let diff = (targetDow - d.getDay() + 7) % 7;
    if (diff === 0 || match[1]) diff += diff === 0 && !match[1] ? 0 : 7;
    if (diff === 0) diff = 0;
    d.setDate(d.getDate() + diff);
    return { date: toISODate(d), rest: text.replace(match[0], "").trim() };
  }

  // "30 November" / "15 October 2026"
  match = text.match(
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/i
  );
  if (match) {
    const day = Number(match[1]);
    const month = MONTHS.indexOf(match[2].toLowerCase());
    const year = match[3] ? Number(match[3]) : today.getFullYear();
    let d = new Date(year, month, day);
    if (!match[3] && d < today) d = new Date(year + 1, month, day);
    return { date: toISODate(d), rest: text.replace(match[0], "").trim() };
  }

  return { date: null, rest: text };
}

function guessKind(text: string, hasAmount: boolean): CaptureKind {
  const lower = text.toLowerCase();
  if (/\bpay\b|\bpayment\b|\binstal?ment\b/.test(lower) && hasAmount) return "debt_payment";
  if (/\bweigh|\bweight\b/.test(lower) && !isNaN(Number(lower.trim()))) return "weight";
  if (/\bbuy\b|\bget\b.*\bfrom (the )?(shop|store)\b/.test(lower)) return "shopping_item";
  if (/\bfuel\b|\bpetrol\b|\bdiesel\b/.test(lower)) return "fuel";
  if (/\bcar\b|\bvehicle\b|\bservice\b.*\b(car|vehicle)\b/.test(lower) && hasAmount) return "vehicle_expense";
  if (/\bvet\b|\bpet\b/.test(lower) && hasAmount) return "pet_expense";
  if (/\bremind\b|\brenew\b|\bexpir/.test(lower)) return "reminder";
  if (/\bgym\b|\bmeeting\b|\bappointment\b|\bdentist\b|\bdoctor\b/.test(lower)) return "appointment";
  if (/\bfeeling\b|\bmood\b/.test(lower)) return "mood";
  if (hasAmount) return "expense";
  return "task";
}

function guessPriority(text: string): ParsedCapture["priority"] {
  const lower = text.toLowerCase();
  if (/\burgent\b|\bcritical\b|\basap\b/.test(lower)) return "critical";
  if (/\bimportant\b|\bhigh priority\b/.test(lower)) return "high";
  if (/\bsome ?time\b|\bwhen(ever)? (i|you) (get a chance|can)\b|\blow priority\b/.test(lower)) return "low";
  return "normal";
}

/** Rule-based extraction — no network call, always available. Used as the
 * baseline and as the fallback when no ANTHROPIC_API_KEY is configured (or
 * the API call fails) for the AI-assisted parser in app/api/capture/parse. */
export function parseCaptureRules(raw: string): ParsedCapture {
  const text = raw.trim();
  const withoutRecurrence = extractRecurrence(text);
  const withoutDate = extractDate(withoutRecurrence.rest);
  const withoutTime = extractTime(withoutDate.rest);
  const withoutAmount = extractAmount(withoutTime.rest);

  const title = withoutAmount.rest.replace(/\s{2,}/g, " ").replace(/^[,-]\s*|\s*[,-]$/g, "").trim() || text;

  return {
    title,
    kind: guessKind(text, withoutAmount.amount !== null),
    amount: withoutAmount.amount,
    date: withoutDate.date,
    time: withoutTime.time,
    recurrence: withoutRecurrence.recurrence,
    priority: guessPriority(text),
    source: "rules",
  };
}

/** SAST-local date+time (or date-only) to a UTC ISO instant, for writing to
 * timestamptz columns (events.starts_at, appointments.appointment_at). */
export function toSastInstant(date: string, time: string | null) {
  return fromZonedTime(`${date}T${time ?? "09:00"}:00`, SAST).toISOString();
}
