import Link from "next/link";
import {
  Building2,
  Users,
  Handshake,
  BanknoteIcon,
  CalendarClock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    icon: Building2,
    title: "Buildings & Portfolios",
    description:
      "A one-screen view of every building - tenants, open actions, arrears and recent site visits, ready for your next meeting.",
  },
  {
    icon: Users,
    title: "Tenants & Leasing",
    description:
      "Lease history, turnover trends and a leasing pipeline per building, with Excel import and export built in.",
  },
  {
    icon: BanknoteIcon,
    title: "Arrears & Collections",
    description:
      "Live balances with a full comment history - follow-up dates, promise-to-pay tracking and escalation flags, without leaving the list.",
  },
  {
    icon: CalendarClock,
    title: "Meeting Mode",
    description:
      "Capture notes live during a meeting and convert any note into an action item, linked straight back to the tenant and building.",
  },
  {
    icon: Handshake,
    title: "Actions, Calendar & Site Visits",
    description:
      "Every open item, important date and site visit tracked against the building or tenant it belongs to.",
  },
  {
    icon: BookOpen,
    title: "Reports & Knowledge Base",
    description:
      "Export-ready arrears reports, tenant schedules and meeting packs, plus a portfolio knowledge base for handovers.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-charcoal-950">
      <header className="border-b border-charcoal-800">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-5">
          <Logo size="sm" />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Intelligence. Systems. Decisions.
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight text-charcoal-100 sm:text-5xl">
          Every building, tenant and lease -{" "}
          <span className="text-cyan-400">in one dashboard.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-charcoal-300 sm:text-lg">
          Vorexa&apos;s Property Management Dashboard brings buildings, tenants,
          leasing, arrears and meetings into a single system of record - so
          every portfolio decision is backed by current, connected data.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/login" className="btn-primary px-6 py-3 text-base">
            Sign In
            <ArrowRight size={18} />
          </Link>
          <a href="mailto:hello@vorexa.co.za" className="btn-secondary px-6 py-3 text-base">
            Request Access
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="card">
              <div className="mb-4 inline-flex rounded-md bg-cyan-600/15 p-2.5 text-cyan-400">
                <Icon size={20} />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-charcoal-100">{title}</h3>
              <p className="text-sm text-charcoal-300">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-charcoal-800 bg-charcoal-900/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-charcoal-700 px-4 py-1.5 text-xs text-charcoal-300">
            <ShieldCheck size={14} className="text-cyan-400" />
            Access is by invitation - your administrator controls who sees what.
          </div>
          <h2 className="max-w-xl text-2xl font-semibold text-charcoal-100">
            One dashboard, every portfolio, complete control over who gets in.
          </h2>
          <p className="max-w-xl text-sm text-charcoal-300">
            Owners, partners and administrators each get access scoped to
            their own portfolios - nothing more, nothing less.
          </p>
          <a
            href="https://www.vorexa.co.za"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-2 px-6 py-3 text-base"
          >
            Learn More at Vorexa.co.za
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <footer className="border-t border-charcoal-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-charcoal-400 sm:flex-row">
          <Logo size="sm" />
          <p>&copy; {new Date().getFullYear()} Vorexa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
