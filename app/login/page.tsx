"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "./actions";

export default function LoginPage() {
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Vorexa</p>
          <h1 className="mt-1 text-xl font-semibold text-text">Personal Dashboard</h1>
        </div>
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
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
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-overdue">{error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
