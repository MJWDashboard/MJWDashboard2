import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Lock,
  EyeOff,
  ShieldCheck,
  Bell,
  Paperclip,
  CalendarClock,
  Link2,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NAV_ITEMS } from "@/lib/nav";
import { LegalFooter } from "@/components/LegalFooter";
import { VOREXA_SITE_URL } from "@/lib/legal";

const MODULE_HREFS = ["/plan", "/health", "/notes", "/calendar", "/money", "/vehicle", "/pets", "/vault"];
const MODULE_DETAILS: Record<string, string> = {
  "/plan": "Tasks, time blocking and a daily plan that fits in the time you actually have.",
  "/health": "Medicines, doses, appointments and weight trends.",
  "/notes": "Fast capture, pinned notes and shopping/checklists.",
  "/calendar": "One timeline for everything due, plus your connected Google Calendar.",
  "/money": "Accounts, transactions, categories, budgets and debt in one place.",
  "/vehicle": "Fuel logs, trips, services and the real cost per kilometre.",
  "/pets": "Care schedules, visits and household assets.",
  "/vault": "Documents, policies, credentials and the estate file.",
};
const MODULES = MODULE_HREFS.map((href) => {
  const item = NAV_ITEMS.find((n) => n.href === href)!;
  return { icon: item.icon, label: item.label, detail: MODULE_DETAILS[href] };
});

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/today");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[rgb(var(--color-navy))]">
      {/* 01 — Header: product lockup, Vorexa / Contact / Support, one Sign in action. */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Image src="/brand/wordmark-light.png" alt="Vorexa Core" width={130} height={43} priority />
        <nav className="flex items-center gap-5 text-sm text-white/60">
          <Link href={VOREXA_SITE_URL} className="hidden hover:text-white sm:inline">
            Vorexa
          </Link>
          <Link href="/contact" className="hidden hover:text-white sm:inline">
            Contact
          </Link>
          <Link href="/contact" className="hidden hover:text-white sm:inline">
            Support
          </Link>
          <Link href="/login" className="btn-primary px-5 py-2 text-sm">
            Sign in
          </Link>
        </nav>
      </header>

      {/* 02 — Hero: headline, proposition, privacy/access line. No second Sign in above the fold. */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(15,174,156,0.18), transparent), linear-gradient(180deg, rgb(var(--color-navy)), rgb(var(--color-midnight)))" }}
      >
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))" }}
        />
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-6 pb-16 pt-10 text-center sm:pt-16">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
            Your life,
            <br />
            <span className="brand-gradient-text">organised around you.</span>
          </h1>
          <p className="mt-5 max-w-md text-balance text-sm text-white/60 sm:text-base">
            Core connects what needs your attention today with the records, money, health, calendar and personal
            administration behind it — in one private operating environment.
          </p>

          <div className="mt-8 flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50 backdrop-blur-sm">
            <Lock size={14} />
            Private production platform. Access is restricted. There is no public sign-up.
          </div>
        </div>
      </div>

      {/* 03 — Today concept: what needs you now. */}
      <section className="border-t border-white/10 bg-[rgb(var(--color-midnight))] px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-2">The Today screen</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            One calm screen that answers what needs you, before anything else.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
            Today surfaces overdue and at-risk reminders, tasks due, important calendar items and a doses-due
            checklist — without turning into a generic task manager. Everything unresolved sits in one inbox
            until you triage it.
          </p>
        </div>
      </section>

      {/* 04 — Life areas / capability grid: only modules that actually exist. */}
      <section className="border-t border-white/10 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-2">Life areas</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Every part of your life, one system.</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MODULES.map((m) => (
              <div
                key={m.label}
                className="flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur-sm transition hover:border-accent/40 hover:bg-white/[0.06]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/15 text-accent-2">
                  <m.icon size={20} />
                </div>
                <p className="text-sm font-medium text-white">{m.label}</p>
                <p className="text-xs text-white/50">{m.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 05 — Connected system. */}
      <section className="border-t border-white/10 bg-[rgb(var(--color-midnight))] px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-2">A connected system</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            The areas of your life aren&apos;t siloed.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <ConnectedPoint icon={Bell} title="Reminders">
              Service, policy, script and debt due-dates surface automatically on the watchlist and Today, driven
              by the records you already keep.
            </ConnectedPoint>
            <ConnectedPoint icon={Paperclip} title="Attachments">
              Receipts, documents and policies attach to the record they belong to — a fuel receipt to the log, a
              policy PDF to the Vault entry.
            </ConnectedPoint>
            <ConnectedPoint icon={CalendarClock} title="Quick capture">
              Capture a fuel-up, expense, weight reading or note the moment it happens, offline if needed, and
              triage it into the right module from the Today inbox.
            </ConnectedPoint>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
            <Link2 size={14} />
            Calendar links events across modules — appointments, service due-dates and important dates all show up
            on one timeline.
          </div>
        </div>
      </section>

      {/* 06 — Privacy by design. */}
      <section className="border-t border-white/10 px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-2">Privacy by design</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Built for one owner, deliberately.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <ConnectedPoint icon={Lock} title="Restricted access">
              No public sign-up. Accounts are created by invitation only, and account creation through any other
              path is blocked at the database level.
            </ConnectedPoint>
            <ConnectedPoint icon={ShieldCheck} title="Sensitive-area locking">
              Health and Vault re-lock after 15 minutes idle and require your account password to re-enter.
            </ConnectedPoint>
            <ConnectedPoint icon={EyeOff} title="Privacy blur">
              One tap hides every sensitive amount and health value on screen — for when someone&apos;s looking
              over your shoulder.
            </ConnectedPoint>
          </div>
          <p className="mt-6 max-w-2xl text-xs text-white/40">
            See the full <Link href="/security" className="text-accent-2 hover:underline">Security</Link> and{" "}
            <Link href="/privacy" className="text-accent-2 hover:underline">Privacy</Link> pages for exactly what
            is and isn&apos;t implemented — we don&apos;t claim protections we haven&apos;t verified.
          </p>
        </div>
      </section>

      {/* 07 — Product proof. No screenshots are published yet — the spec is
          explicit that marketing screenshots must come from a sanitised
          fixture environment, never the live owner dataset, so none are
          shown here until that workflow exists. We keep this honest rather
          than fabricate a "coming soon" image. */}
      <section className="border-t border-white/10 px-6 py-14 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-2">Product proof</p>
          <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">What&apos;s actually built, not a mockup.</h2>
          <p className="mt-3 max-w-2xl text-sm text-white/60">
            Today, Health, Notes &amp; Lists, Calendar, Money, Vehicle &amp; Travel, Home &amp; Pets and Vault are
            live, working modules in the current production build — not placeholders. Screenshots will be added
            here from a sanitised, fixture-only environment; we don&apos;t publish captures of real account data.
          </p>
        </div>
      </section>

      {/* 08 — Vorexa relationship. */}
      <section className="border-t border-white/10 bg-[rgb(var(--color-midnight))] px-6 py-14 sm:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-2">Part of Vorexa</p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              Vorexa Core is the private, personal side of the Vorexa product family.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/60">
              Vorexa also builds Vorexa Atlas for commercial property operations — different applications, one
              Vorexa standard.
            </p>
          </div>
          <Link
            href={VOREXA_SITE_URL}
            className="btn-secondary flex shrink-0 items-center gap-1.5 whitespace-nowrap"
          >
            Visit the Vorexa website
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      {/* 09 — Legal footer, identical in structure across every Vorexa platform. */}
      <LegalFooter />
    </div>
  );
}

function ConnectedPoint({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Bell;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent/15 text-accent-2">
        <Icon size={18} />
      </div>
      <p className="mt-3 text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/50">{children}</p>
    </div>
  );
}
