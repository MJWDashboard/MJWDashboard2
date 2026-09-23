import Link from "next/link";
import { CheckCircle2, CalendarDays, ListTodo, AlertTriangle, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTodayEvents, getGreetingName, getDosesDueSummary, timeOfDayGreeting } from "@/lib/today";
import { getWatchlist } from "@/lib/watchlist";
import { getTodayTasks } from "@/lib/tasks";
import { getPendingCaptures } from "@/lib/quickCaptureServer";
import { WatchCard } from "@/components/WatchCard";
import { EmptyState } from "@/components/EmptyState";
import { LiveClock } from "@/components/LiveClock";
import { NAV_ITEMS } from "@/lib/nav";
import { TasksCard } from "./TasksCard";
import { InboxCard } from "./InboxCard";

const healthColor = NAV_ITEMS.find((n) => n.href === "/health")!.color;
const calendarColor = NAV_ITEMS.find((n) => n.href === "/calendar")!.color;

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const [watchlist, events, name, doses, tasks, pendingCaptures] = await Promise.all([
    getWatchlist(),
    getTodayEvents(),
    getGreetingName(),
    getDosesDueSummary(),
    getTodayTasks(),
    getPendingCaptures(),
  ]);

  const needsTriage = pendingCaptures.filter((c) => c.type === "fuel" || c.type === "expense");
  let vehicles: { id: string; make: string; model: string }[] = [];
  let accounts: { id: string; name: string }[] = [];
  if (needsTriage.length > 0) {
    const supabase = await createClient();
    const [{ data: vehicleRows }, { data: accountRows }] = await Promise.all([
      supabase.from("vehicles").select("id, make, model"),
      supabase.from("accounts").select("id, name"),
    ]);
    vehicles = vehicleRows ?? [];
    accounts = accountRows ?? [];
  }

  const greeting = timeOfDayGreeting();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">
          {greeting}{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
          <span className="text-border">·</span>
          <LiveClock />
        </p>
      </div>

      {needsTriage.length > 0 && (
        <Section title="Inbox" icon={Inbox} color="#0FAE9C">
          <InboxCard captures={needsTriage} vehicles={vehicles} accounts={accounts} />
        </Section>
      )}

      <Section title="Doses due" icon={CheckCircle2} color={healthColor}>
        {doses.total === 0 ? (
          <EmptyState icon={CheckCircle2} title="No medicines scheduled" detail="Add a medicine in Health to see today's checklist here." />
        ) : (
          <Link href="/health" className="card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">{doses.remaining} of {doses.total} remaining</p>
              <p className="text-xs text-muted">Counts only — open Health for detail</p>
            </div>
            <span className={doses.remaining === 0 ? "status-pill-ok" : "status-pill-soon"}>
              {doses.remaining === 0 ? "All done" : "Open Health"}
            </span>
          </Link>
        )}
      </Section>

      <Section title="Calendar" icon={CalendarDays} color={calendarColor}>
        {events.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Nothing on today" detail="Add an event, or connect Google Calendar from the Calendar tab, to see it here." />
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm text-text">{event.title}</p>
                  <p className="text-xs text-muted">
                    {new Date(event.starts_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {event.transport_needed && (
                  <span className="status-pill-soon">
                    {event.transport_confirmed ? "Transport confirmed" : "Transport needed"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Tasks" icon={ListTodo} color="#0FAE9C">
        <TasksCard tasks={tasks} />
      </Section>

      <Section title="Watchlist" icon={AlertTriangle} color="rgb(var(--color-overdue))">
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
  icon: typeof CheckCircle2;
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
