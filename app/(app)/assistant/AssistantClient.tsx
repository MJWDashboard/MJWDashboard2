"use client";

import { useState, useTransition } from "react";
import { Sparkles, Send, AlertTriangle } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { askAssistant } from "@/lib/assistant";

type Query = Tables<"assistant_queries">;

const SUGGESTIONS = [
  "How much have I spent this month?",
  "What tasks are overdue?",
  "What needs my attention this week?",
  "What's my longest current habit streak?",
];

export function AssistantClient({ history, hasApiKey }: { history: Query[]; hasApiKey: boolean }) {
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<{ question: string; answer: string; error: string | null }[]>([]);
  const [pending, startTransition] = useTransition();

  function ask(q: string) {
    if (!q.trim() || pending) return;
    setQuestion("");
    startTransition(async () => {
      const result = await askAssistant(q);
      setThread((prev) => [...prev, { question: q, answer: result.answer, error: result.error }]);
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader icon={Sparkles} color="#0FAE9C" eyebrow="Intelligence" title="Core Assistant" />

      {!hasApiKey && (
        <div className="card flex items-start gap-2.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-overdue" />
          <p className="text-sm text-text">
            No <code className="text-xs">ANTHROPIC_API_KEY</code> is configured — the assistant can't answer questions until one is added in Settings/Vercel.
          </p>
        </div>
      )}

      {thread.length === 0 && history.length === 0 ? (
        <EmptyState icon={Sparkles} title="Ask about your own data" detail="Money, tasks, habits, goals — Core answers only from what's on file, never guesses." />
      ) : (
        <div className="space-y-3">
          {[...history].reverse().map((h) => (
            <QA key={h.id} question={h.question} answer={h.answer} />
          ))}
          {thread.map((t, i) => (
            <QA key={`live-${i}`} question={t.question} answer={t.answer} error={t.error} />
          ))}
          {pending && <p className="text-xs text-muted">Thinking...</p>}
        </div>
      )}

      {thread.length === 0 && history.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-text">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          placeholder="Ask about your money, tasks, habits or goals..."
          disabled={!hasApiKey}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent disabled:opacity-50"
        />
        <button onClick={() => ask(question)} disabled={!hasApiKey || pending} className="btn-primary px-3" aria-label="Ask">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function QA({ question, answer, error }: { question: string; answer: string; error?: string | null }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted">{question}</p>
      <div className="card text-sm text-text">
        {error ? <span className="text-overdue">{error}</span> : answer}
      </div>
    </div>
  );
}
