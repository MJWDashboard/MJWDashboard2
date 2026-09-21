"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { signIn, register } from "./actions";
import { Wordmark } from "@/components/Wordmark";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "register">("signin");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/brand/mark.png" alt="" width={48} height={48} priority />
          <Wordmark width={130} className="mt-3" />
          <h1 className="mt-4 text-xl font-semibold text-text">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "signin" ? "Sign in to Vorexa Personal" : "First account on this platform becomes the developer"}
          </p>
        </div>

        <div className="mb-4 flex rounded-full border border-border bg-surface/60 p-1 text-sm">
          <button
            onClick={() => setMode("signin")}
            className={clsx(
              "flex-1 rounded-full py-1.5 font-medium transition",
              mode === "signin" ? "bg-accent text-white" : "text-muted"
            )}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("register")}
            className={clsx(
              "flex-1 rounded-full py-1.5 font-medium transition",
              mode === "register" ? "bg-accent text-white" : "text-muted"
            )}
          >
            Create account
          </button>
        </div>

        {mode === "signin" ? <SignInForm /> : <RegisterForm />}

        <Link href="/" className="mt-4 block text-center text-xs text-muted hover:text-text">
          Back to home
        </Link>
      </div>
    </div>
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
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
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
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      {error && <p className="text-sm text-overdue">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<"signed-in" | "confirm-email" | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await register(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.signedIn) {
      setDone("signed-in");
      router.push("/today");
      router.refresh();
      return;
    }
    setDone("confirm-email");
  }

  if (done === "confirm-email") {
    return (
      <div className="card space-y-2 text-sm">
        <p className="text-text">Account created.</p>
        <p className="text-muted">Check your email to confirm the address, then sign in.</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="card space-y-4">
      <div className="flex gap-2">
        <input
          name="firstName"
          placeholder="First name"
          autoComplete="given-name"
          className="w-1/2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
        <input
          name="lastName"
          placeholder="Surname"
          autoComplete="family-name"
          className="w-1/2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="mb-1 block text-sm text-muted">
          Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="mb-1 block text-sm text-muted">
          Choose a password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>
      {error && <p className="text-sm text-overdue">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
