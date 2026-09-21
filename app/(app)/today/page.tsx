import Link from "next/link";
import { CheckCircle2, CalendarDays, ListTodo, AlertTriangle } from "lucide-react";
import { getWatchlist, getTodayEvents, getGreetingName, getDosesDueSummary, timeOfDayGreeting } from "@/lib/today";
import { WatchCard } from "@/components/WatchCard";
import { EmptyState } from "@/components/EmptyState";
import { LiveClock } from "@/components/LiveClock";
import { NAV_ITEMS } from "@/lib/nav";

const healthColor = NAV_ITEMS.find((n) => n.href === "/health")!.color;
const calendarColor = NAV_ITEMS.find((n) => n.href === "/calendar")!.color;

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const [watchlist, events, name, doses] = await Promise.all([
    getWatchlist(),
    getTodayEvents(),
    getGreetingName(),
    getDosesDueSummary(),
  ]);

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
          <EmptyState icon={CalendarDays} title="Nothing on today" detail="Events will appear here once Google Calendar sync is connected in Phase 1." />
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

      <Section title="Tasks" icon={ListTodo} color="#0E84FF">
        <EmptyState
          icon={ListTodo}
          title="Personal task caps arrive in Phase 1"
          detail="1 critical, 2 important, 3 admin — same ACE rule, tracked here with a capacity meter."
        />
      </Section>

      <Section title="Watchlist" icon={AlertTriangle} color="#F26D78">
        {watchlist.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nothing at risk"
            detail="Ranked items from every module — amount at risk, due date, distance to threshold — will collect here as later phases are built."
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
