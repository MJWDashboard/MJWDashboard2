"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock } from "lucide-react";
import { signIn } from "./actions";
import { LEGAL_LINKS, VOREXA_SITE_URL } from "@/lib/legal";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only, always dark navy regardless of app theme. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[rgb(var(--color-navy))] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))" }}
        />
        <Link href="/" className="relative">
          <Image src="/brand/wordmark-light.png" alt="Vorexa Core" width={150} height={50} priority />
        </Link>
        <div className="relative">
          <p className="text-3xl font-bold leading-tight">Your life, organised around you.</p>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/50">Plan. Track. Live better.</p>
          <p className="mt-6 flex items-center gap-1.5 text-xs text-white/40">
            <Lock size={12} />
            Private access — invitation only. There is no public sign-up.
          </p>
        </div>
        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
          <span>© {new Date().getFullYear()} Vorexa. All rights reserved.</span>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white/70">
              {l.label}
            </Link>
          ))}
          <Link href={VOREXA_SITE_URL} className="hover:text-white/70">
            vorexa.co.za
          </Link>
        </div>
      </div>

      {/* Compact header — mobile only. */}
      <div className="flex flex-col items-center px-6 pt-12 text-center lg:hidden">
        <Link href="/">
          <Image src="/brand/wordmark-light.png" alt="Vorexa Core" width={120} height={40} priority />
        </Link>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10">
        <div
          className="pointer-events-none absolute -top-16 right-0 h-80 w-80 rounded-full opacity-[0.12] blur-3xl"
          style={{ backgroundColor: "rgb(var(--color-accent-2))" }}
        />
        <div className="relative w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-xl font-semibold text-text">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Sign in to your Vorexa Core account</p>
          </div>

          <SignInForm />

          <div className="mt-4 flex items-center justify-between text-xs text-muted">
            <Link href="/" className="hover:text-text">
              Back to home
            </Link>
            <Link href="/contact" className="hover:text-text">
              Forgot password / access support
            </Link>
          </div>
        </div>

        {/* Legal links + rights notice, visible without leaving the auth context — mobile only (desktop shows them on the brand panel). */}
        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 text-center text-xs text-muted lg:hidden">
          <span>© {new Date().getFullYear()} Vorexa</span>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-text">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-overdue">
      <AlertCircle size={14} className="shrink-0" />
      {message}
    </p>
  );
}

function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="card space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      {error && <FormError message={error} />}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
