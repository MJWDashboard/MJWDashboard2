"use server";

import { toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { SAST } from "@/lib/timezone";
import { formatZAR, availableCash, currentMonth } from "@/lib/money";
import { currentStreak, type Habit, type HabitLog } from "@/lib/habits";
import { getWatchlist } from "@/lib/watchlist";

const MODEL = "claude-sonnet-5";

/** Builds a compact, factual JSON snapshot of the owner's own data across
 * modules — deliberately bounded (top-N items, current month only) to keep
 * the prompt small and the cost predictable. Nothing here leaves the
 * account: it's assembled server-side and sent only to the Claude API call
 * that answers the current question. */
async function summariseUserData() {
  const supabase = await createClient();
  const today = toZonedTime(new Date(), SAST);
  const month = currentMonth(today);
  const todayStr = today.toISOString().slice(0, 10);

  const [
    { data: accounts },
    { data: allTransactions },
    { data: debts },
    { data: recurringExpenses },
    { data: tasks },
    { data: habits },
    { data: habitLogs },
    { data: goals },
    watchlist,
  ] = await Promise.all([
    supabase.from("accounts").select("*"),
    supabase.from("transactions").select("*"),
    supabase.from("debts").select("creditor, balance, minimum_payment, status").eq("status", "active"),
    supabase.from("recurring_expenses").select("provider, amount, next_due_date").eq("active", true).order("next_due_date", { ascending: true }).limit(5),
    supabase.from("tasks").select("title, status, due_date").in("status", ["planned", "in_progress", "waiting"]).order("due_date", { ascending: true }).limit(15),
    supabase.from("habits").select("*").eq("active", true),
    supabase.from("habit_logs").select("*"),
    supabase.from("goals").select("title, next_action, deadline, status").in("status", ["active", "planned"]),
    getWatchlist(),
  ]);

  const allTx = allTransactions ?? [];
  const monthTx = allTx.filter((t) => t.occurred_at.slice(0, 7) === month);
  const spend = monthTx.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const income = monthTx.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
  const cash = accounts ? availableCash(accounts, allTx) : null;

  const habitList = (habits ?? []) as Habit[];
  const logsByHabit = new Map<string, HabitLog[]>();
  for (const log of (habitLogs ?? []) as HabitLog[]) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }

  return {
    today: todayStr,
    money: {
      available_cash: cash != null ? formatZAR(cash) : "unknown",
      spent_this_month: formatZAR(spend),
      income_this_month: formatZAR(income),
      active_debts: (debts ?? []).map((d) => ({
        creditor: d.creditor,
        balance: formatZAR(Number(d.balance)),
        minimum_payment: d.minimum_payment != null ? formatZAR(Number(d.minimum_payment)) : null,
      })),
      upcoming_bills: (recurringExpenses ?? []).map((r) => ({
        provider: r.provider,
        amount: formatZAR(Number(r.amount)),
        due: r.next_due_date,
      })),
    },
    tasks_open: (tasks ?? []).map((t) => ({ title: t.title, status: t.status, due_date: t.due_date })),
    habits: habitList.map((h) => ({ name: h.name, current_streak_days: currentStreak(h, logsByHabit.get(h.id) ?? []) })),
    goals: (goals ?? []).map((g) => ({ title: g.title, next_action: g.next_action, deadline: g.deadline })),
    needs_attention: watchlist.slice(0, 8).map((w) => ({ title: w.title, due_at: w.due_at, severity: w.severity })),
  };
}

export type AssistantAnswer = { answer: string; error: string | null };

/** Core Assistant: answers a natural-language question about the owner's
 * own data. Read-only — it never writes anything except logging the Q&A to
 * assistant_queries for the owner's own history. Requires ANTHROPIC_API_KEY;
 * without one it says so plainly rather than guessing. */
export async function askAssistant(question: string): Promise<AssistantAnswer> {
  const q = question.trim();
  if (!q) return { answer: "", error: "Ask a question first." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      answer: "",
      error: "The Core Assistant needs an ANTHROPIC_API_KEY configured in Settings/Vercel before it can answer questions.",
    };
  }

  try {
    const context = await summariseUserData();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        temperature: 0,
        system:
          "You are Core, a private assistant answering questions about one person's own data in a personal-organiser app. " +
          "Answer ONLY using the JSON context provided — never invent numbers, dates or facts not present in it. " +
          "If the answer isn't in the context, say plainly that you don't have that on file and name which module (Money, Plan, Wellness, Goals, etc.) would have it. " +
          "Be concise and factual — 1-4 sentences, no generic advice, no filler, no motivational language. " +
          `Context:\n${JSON.stringify(context)}`,
        messages: [{ role: "user", content: q.slice(0, 500) }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { answer: "", error: `Assistant request failed (${res.status}). Try again shortly.` };
    }
    const data = await res.json();
    const block = Array.isArray(data.content) ? data.content.find((c: { type: string }) => c.type === "text") : null;
    const answer = typeof block?.text === "string" ? block.text.trim() : "";
    if (!answer) return { answer: "", error: "The assistant didn't return an answer. Try rephrasing." };

    const supabase = await createClient();
    await supabase.from("assistant_queries").insert({ question: q, answer });

    return { answer, error: null };
  } catch {
    return { answer: "", error: "The assistant couldn't be reached. Check your connection and try again." };
  }
}

export async function getAssistantHistory() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assistant_queries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}
