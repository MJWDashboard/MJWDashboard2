"use server";

import { toZonedTime } from "date-fns-tz";
import { SAST } from "@/lib/timezone";
import { parseCaptureRules, type ParsedCapture, type CaptureKind } from "@/lib/captureParser";

const KINDS: CaptureKind[] = [
  "task", "expense", "note", "appointment", "reminder", "shopping_item",
  "debt_payment", "weight", "fuel", "vehicle_expense", "pet_expense", "general",
];
const RECURRENCES: ParsedCapture["recurrence"][] = ["none", "daily", "weekly", "monthly"];
const PRIORITIES: ParsedCapture["priority"][] = ["critical", "high", "normal", "low"];

const MODEL = "claude-haiku-4-5-20251001";

function isValid<T>(value: unknown, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}

/** Natural-language Quick Capture parsing. Uses the Anthropic API when
 * ANTHROPIC_API_KEY is configured (Settings/Vercel env); otherwise, and on
 * any API failure, falls back to the rule-based parser so capture always
 * works. The result is always a proposal the user confirms before saving —
 * this never writes data on its own. */
export async function parseCaptureSmart(text: string): Promise<ParsedCapture> {
  const rulesResult = parseCaptureRules(text);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !text.trim()) return rulesResult;

  try {
    const today = toZonedTime(new Date(), SAST);
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        temperature: 0,
        system:
          `Extract structured fields from a short personal capture entered into a personal-organiser app. ` +
          `Today is ${todayIso} (Africa/Johannesburg). Respond with ONLY a single JSON object, no prose, no markdown fences: ` +
          `{"title": string, "kind": one of ${JSON.stringify(KINDS)}, "amount": number|null, "date": "YYYY-MM-DD"|null, ` +
          `"time": "HH:mm"|null (24h), "recurrence": one of ${JSON.stringify(RECURRENCES)}, "priority": one of ${JSON.stringify(PRIORITIES)}}. ` +
          `"title" is the capture with date/time/amount/recurrence words removed, kept short and natural. ` +
          `Amounts are in South African Rand. If nothing indicates a field, use null (or "none"/"normal" for recurrence/priority).`,
        messages: [{ role: "user", content: text.slice(0, 500) }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return rulesResult;
    const data = await res.json();
    const block = Array.isArray(data.content) ? data.content.find((c: { type: string }) => c.type === "text") : null;
    if (!block?.text) return rulesResult;

    const jsonMatch = block.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return rulesResult;
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : rulesResult.title,
      kind: isValid(parsed.kind, KINDS) ? parsed.kind : rulesResult.kind,
      amount: typeof parsed.amount === "number" ? parsed.amount : rulesResult.amount,
      date: typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : rulesResult.date,
      time: typeof parsed.time === "string" && /^\d{2}:\d{2}$/.test(parsed.time) ? parsed.time : rulesResult.time,
      recurrence: isValid(parsed.recurrence, RECURRENCES) ? parsed.recurrence : rulesResult.recurrence,
      priority: isValid(parsed.priority, PRIORITIES) ? parsed.priority : rulesResult.priority,
      source: "ai",
    };
  } catch {
    // Network error, timeout, bad JSON — never block the user on this.
    return rulesResult;
  }
}
