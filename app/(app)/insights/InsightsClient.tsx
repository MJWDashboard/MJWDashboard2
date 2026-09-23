"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { LineChart, Wallet, Clock, HeartPulse, Car, Target, TrendingUp, TrendingDown, Info, CalendarRange, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import type { Insight } from "@/lib/insights";

const CATEGORY_ICON = {
  Money: Wallet,
  Time: Clock,
  Habits: HeartPulse,
  Vehicle: Car,
  Goals: Target,
} as const;

const CATEGORY_ORDER: Insight["category"][] = ["Money", "Time", "Habits", "Vehicle", "Goals"];

const TONE_ICON: Record<Insight["tone"], typeof TrendingUp> = {
  positive: TrendingUp,
  warning: TrendingDown,
  neutral: Info,
};

const TONE_CLASS: Record<Insight["tone"], string> = {
  positive: "text-ok",
  warning: "text-overdue",
  neutral: "text-muted",
};

export function InsightsClient({ insights }: { insights: Insight[] }) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: insights.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <PageHeader icon={LineChart} color="#0FAE9C" eyebrow="Intelligence" title="Insights" />

      <div className="flex gap-2">
        <Link href="/insights/weekly-review" className="btn-secondary flex flex-1 items-center justify-center gap-1.5 text-sm">
          <CalendarRange size={15} /> Weekly Review
        </Link>
        <Link href="/insights/monthly-review" className="btn-secondary flex flex-1 items-center justify-center gap-1.5 text-sm">
          <CalendarDays size={15} /> Monthly Review
        </Link>
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="Nothing to report yet"
          detail="Insights need a bit of data first — log some transactions, tasks and habits and check back."
        />
      ) : (
        grouped.map(({ category, items }) => {
          const CategoryIcon = CATEGORY_ICON[category];
          return (
            <div key={category} className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                <CategoryIcon size={13} /> {category}
              </p>
              <div className="space-y-2">
                {items.map((insight) => {
                  const ToneIcon = TONE_ICON[insight.tone];
                  return (
                    <Link key={insight.id} href={insight.href} className="card flex items-start gap-2.5">
                      <ToneIcon size={16} className={clsx("mt-0.5 shrink-0", TONE_CLASS[insight.tone])} />
                      <p className="text-sm text-text">{insight.text}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
