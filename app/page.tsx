import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, HeartPulse, Lock, PawPrint, ShieldCheck, StickyNote, Wallet, Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const MODULES = [
  { icon: HeartPulse, label: "Health", detail: "Doses, appointments, weight trends" },
  { icon: StickyNote, label: "Notes & Lists", detail: "Fast capture, shopping lists" },
  { icon: CalendarDays, label: "Calendar", detail: "One timeline for everything due" },
  { icon: Wallet, label: "Money", detail: "Budget, debt, tax — one set of accounts" },
  { icon: Car, label: "Vehicle & Travel", detail: "Fuel, trips, real cost per km" },
  { icon: PawPrint, label: "Home & Pets", detail: "Care schedules, shared costs" },
  { icon: ShieldCheck, label: "Vault", detail: "Documents, policies, the estate file" },
];

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/today");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))" }}
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-6 pb-16 pt-14 text-center">
        <Image src="/brand/mark.png" alt="Vorexa" width={56} height={56} priority />
        <p className="mt-4 text-sm font-bold tracking-[0.2em] text-text">VOREXA</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          One private dashboard for your whole day
        </h1>
        <p className="mt-4 max-w-md text-balance text-sm text-muted sm:text-base">
          Health, money, the car, the pets, the vault — seven modules around a single
          <span className="text-text"> Today</span> screen that answers what needs you, before anything else.
        </p>

        <Link href="/login" className="btn-primary mt-8 px-8 py-3 text-base">
          Sign in
        </Link>

        <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-xs text-muted">
          <Lock size={14} />
          Access restricted — this is a private, single-owner dashboard. There is no public sign-up.
        </div>

        <div className="mt-16 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.label} className="card flex flex-col items-center gap-2 py-5 text-center">
              <m.icon size={20} className="text-accent" />
              <p className="text-sm font-medium text-text">{m.label}</p>
              <p className="text-xs text-muted">{m.detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-xs text-muted">Intelligence. Systems. Decisions.</p>
      </div>
    </div>
  );
}
