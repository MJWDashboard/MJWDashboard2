import Link from "next/link";
import {
  AlertTriangle,
  Wallet,
  HeartPulse,
  Sunrise,
  Moon,
  Inbox,
  ListChecks,
  Clock3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGreetingName, getDosesDueSummary, timeOfDayGreeting } from "@/lib/today";
import { getWatchlist } from "@/lib/watchlist";
import { getMyDay } from "@/lib/myDay";
import { getTodayPriorities, getTodayOpenTaskCount } from "@/lib/planTasks";
import { getMoneyToday } from "@/lib/moneyToday";
import { getWellnessToday } from "@/lib/wellnessToday";
import { getPendingCaptures } from "@/lib/quickCaptureServer";
import { WatchCard } from "@/components/WatchCard";
import { EmptyState } from "@/components/EmptyState";
import { LiveClock } from "@/components/LiveClock";
import { formatZAR } from "@/lib/money";
import { InboxCard } from "./InboxCard";
import { PriorityCard } from "./PriorityCard";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const [watchlist, myDay, name, doses, priorities, taskCount, money, wellness, pendingCaptures] = await Promise.all([
    getWatchlist(),
    getMyDay(),
    getGreetingName(),
    getDosesDueSummary(),
    getTodayPriorities(),
    getTodayOpenTaskCount(),
    getMoneyToday(),
    getWellnessToday(),
    getPendingCaptures(),
  ]);

  const needsTriage = pendingCaptures.filter((c) => c.type === "fuel" || c.type === "expense" || c.type === "debt_payment");
  let vehicles: { id: string; make: string; model: string }[] = [];
  let accounts: { id: string; name: string }[] = [];
  let debts: { id: string; creditor: string }[] = [];
  if (needsTriage.length > 0) {
    const supabase = await createClient();
    const [{ data: vehicleRows }, { data: accountRows }, { data: debtRows }] = await Promise.all([
      supabase.from("vehicles").select("id, make, model"),
      supabase.from("accounts").select("id, name"),
      supabase.from("debts").select("id, creditor").eq("status", "active"),
    ]);
    vehicles = vehicleRows ?? [];
    accounts = accountRows ?? [];
    debts = debtRows ?? [];
  }

  const greeting = timeOfDayGreeting();
  const attentionCount = watchlist.length;
  const doneCount = priorities.filter((p) => p.status === "complete").length + (taskCount.done ?? 0);
  const totalCount = priorities.length + taskCount.total;
  const dayProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">
          {greeting}{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
          {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
          <span className="text-border">·</span>
          <LiveClock />
          {attentionCount > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="text-soon">
                {attentionCount} item{attentionCount === 1 ? "" : "s"} need{attentionCount === 1 ? "s" : ""} attention
              </span>
            </>
          )}
        </p>
      </div>

      <div className="flex gap-2">
        <Link href="/plan/morning-review" className="btn-secondary flex flex-1 items-center justify-center gap-1.5 text-sm">
          <Sunrise size={15} /> Morning Review
        </Link>
        <Link href="/plan/evening-shutdown" className="btn-secondary flex flex-1 items-center justify-center gap-1.5 text-sm">
          <Moon size={15} /> Evening Shutdown
        </Link>
      </div>

      {needsTriage.length > 0 && (
        <Section title="Inbox" icon={Inbox} color="#0FAE9C">
          <InboxCard captures={needsTriage} vehicles={vehicles} accounts={accounts} debts={debts} />
        </Section>
      )}

      <Section title="My Day" icon={Clock3} color="#0FAE9C">
        {myDay.length === 0 ? (
          <EmptyState icon={Clock3} title="Nothing on the clock today" detail="Events, scheduled tasks and appointments will line up here." />
        ) : (
          <div className="space-y-2">
            {myDay.map((item) => (
              <Link key={item.id} href={item.href} className="card flex items-center gap-3">
                <span className="w-12 shrink-0 text-xs font-medium text-muted">{item.time ?? "Today"}</span>
                <span className="text-sm text-text">{item.title}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="Top Priorities" icon={ListChecks} color="#0FAE9C">
        {priorities.length === 0 ? (
          <EmptyState icon={ListChecks} title="No priorities set for today" detail="Run the Morning Review, or pick up to 3 priorities from Plan." />
        ) : (
          <div className="space-y-2">
            {priorities.map((task, i) => (
              <PriorityCard key={task.id} task={task} isMainFocus={i === 0} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Needs Attention" icon={AlertTriangle} color="rgb(var(--color-overdue))">
        {watchlist.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nothing at risk"
            detail="Licence discs, services, policy renewals, script expiries, low medicine stock and debt due dates are checked live — nothing needs you right now."
          />
        ) : (
          <div className="space-y-2">
            {watchlist.map((reminder) => (
              <WatchCard key={reminder.id} reminder={reminder} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Money Today" icon={Wallet} color="#0FAE9C">
        <div className="card grid grid-cols-2 gap-4">
          <Stat label="Available" value={formatZAR(money.availableCash)} />
          <Stat label="Spent this month" value={formatZAR(money.monthToDateExpenses)} />
          <Stat label="Spent today" value={formatZAR(money.expensesToday)} />
          <Stat
            label="Upcoming bills (30d)"
            value={money.upcomingBillsCount > 0 ? `${money.upcomingBillsCount} · ${formatZAR(money.upcomingBillsTotal)}` : "None"}
          />
        </div>
        {money.debtDueSoon && (
          <Link href="/money" className="card mt-2 flex items-center justify-between">
            <span className="text-sm text-text">{money.debtDueSoon.creditor} payment due</span>
            <span className="status-pill-soon">
              {money.debtDueSoon.dueInDays === 0 ? "Today" : `${money.debtDueSoon.dueInDays}d`}
            </span>
          </Link>
        )}
      </Section>

      <Section title="Wellness Today" icon={HeartPulse} color="#0FAE9C">
        <div className="card grid grid-cols-2 gap-4">
          <Stat label="Doses" value={doses.total === 0 ? "None scheduled" : `${doses.remaining}/${doses.total} left`} />
          <Stat label="Appointments" value={wellness.appointmentsToday > 0 ? `${wellness.appointmentsToday} today` : "None today"} />
        </div>
      </Section>

      <div className="card flex items-center justify-between">
        <span className="text-sm font-medium text-text">Day progress</span>
        <span className="text-sm text-muted">{dayProgress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${dayProgress}%` }} />
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  icon: typeof Wallet;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text">
        <Icon size={16} style={{ color }} />
        {title}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p data-sensitive className="tabular text-sm font-semibold text-text">
        {value}
      </p>
    </div>
  );
}
