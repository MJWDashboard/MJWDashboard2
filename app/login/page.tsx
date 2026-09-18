"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push(next);
      router.refresh();
      return;
    }
    setInfo("Account created. Check your email to confirm before signing in.");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-charcoal-100">
          Vorexa <span className="text-cyan-400">Vault</span>
        </h1>
        <p className="mt-1 text-sm text-charcoal-300">
          Desktop Property Manager platform
        </p>
      </div>

      <div className="card">
        <div className="mb-4 flex rounded-md border border-charcoal-600 p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`flex-1 rounded px-3 py-1.5 transition-colors ${
              mode === "sign-in"
                ? "bg-cyan-600 text-charcoal-950"
                : "text-charcoal-300"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`flex-1 rounded px-3 py-1.5 transition-colors ${
              mode === "sign-up"
                ? "bg-cyan-600 text-charcoal-950"
                : "text-charcoal-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {info && <p className="text-sm text-cyan-400">{info}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </div>

      {mode === "sign-up" && (
        <p className="mt-4 text-center text-xs text-charcoal-400">
          New accounts join the existing portfolio automatically if no one
          has signed up yet, or by invitation otherwise.
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal-950 px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
