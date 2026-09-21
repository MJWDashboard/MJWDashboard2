import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NAV_ITEMS } from "@/lib/nav";

const MODULE_DETAILS: Record<string, string> = {
  "/health": "Doses, appointments, weight trends",
  "/notes": "Fast capture, shopping lists",
  "/calendar": "One timeline for everything due",
  "/money": "Budget, debt, tax — one set of accounts",
  "/vehicle": "Fuel, trips, real cost per km",
  "/pets": "Care schedules, shared costs",
  "/vault": "Documents, policies, the estate file",
};
const MODULES = NAV_ITEMS.filter((n) => n.href !== "/today").map((n) => ({
  icon: n.icon,
  label: n.label,
  detail: MODULE_DETAILS[n.href],
}));

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/today");
  }

  return (
    <div data-vx-theme="light" className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <Image src="/brand/wordmark.png" alt="Vorexa Core" width={130} height={43} priority />
        <Link href="/login" className="btn-primary px-5 py-2 text-sm">
          Sign in
        </Link>
      </header>

      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-[0.15] blur-3xl"
        style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))" }}
      />

      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-6 pb-8 pt-10 text-center sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-5xl sm:leading-[1.1]">
          Everything in your life.
          <br />
          In one place.
        </h1>
        <p className="mt-5 max-w-md text-balance text-sm text-muted sm:text-base">
          Organise your goals, finances, calendar and personal records — one calm, focused
          <span className="text-text"> Today</span> screen that answers what needs you, before anything else.
        </p>

        <Link href="/login" className="btn-primary mt-8 px-8 py-3 text-base">
          Sign in
        </Link>

        <div className="mt-4 flex items-center gap-2 rounded-[10px] border border-border bg-white px-4 py-2 text-xs text-muted">
          <Lock size={14} />
          Access restricted — this is a private, single-owner dashboard. There is no public sign-up.
        </div>

        <div className="mt-16 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          {MODULES.map((m, i) => (
            <div
              key={m.label}
              className={
                "card flex flex-col items-center gap-2 py-6 text-center" +
                (i === MODULES.length - 1 ? " col-span-2 sm:col-span-3" : "")
              }
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/10 text-accent">
                <m.icon size={20} />
              </div>
              <p className="text-sm font-medium text-text">{m.label}</p>
              <p className="text-xs text-muted">{m.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-border px-6 py-6 text-xs text-muted sm:px-10">
        <span className="flex items-center gap-1.5">
          <Image src="/brand/mark.png" alt="" width={14} height={12} />
          Vorexa Core
        </span>
        <span>Your life, organised around you.</span>
      </div>
    </div>
  );
}
