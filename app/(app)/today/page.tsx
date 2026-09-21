import Link from "next/link";
import { CheckCircle2, CalendarDays, ListTodo, AlertTriangle } from "lucide-react";
import { getWatchlist, getTodayEvents, getGreetingName, timeOfDayGreeting, getDosesDueSummary } from "@/lib/today";
import { WatchCard } from "@/components/WatchCard";
import { EmptyState } from "@/components/EmptyState";

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
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-xl font-semibold text-text">
          {greeting}{name ? `, ${name}` : ""}
        </h1>
      </div>

      <Section title="Doses due" icon={CheckCircle2}>
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

      <Section title="Calendar" icon={CalendarDays}>
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

      <Section title="Tasks" icon={ListTodo}>
        <EmptyState
          icon={ListTodo}
          title="Personal task caps arrive in Phase 1"
          detail="1 critical, 2 important, 3 admin — same ACE rule, tracked here with a capacity meter."
        />
      </Section>

      <Section title="Watchlist" icon={AlertTriangle}>
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
  children,
}: {
  title: string;
  icon: typeof CheckCircle2;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text">
        <Icon size={16} className="text-muted" />
        {title}
      </div>
      {children}
    </section>
  );
}
