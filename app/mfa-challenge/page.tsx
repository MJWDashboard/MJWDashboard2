"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaChallengePage() {
  const router = useRouter();
  const supabase = createClient();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadFactor() {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setError(error.message);
        return;
      }
      const verified = data.totp.find((f) => f.status === "verified");
      setFactorId(verified?.id ?? null);
    }
    loadFactor();
  }, [supabase]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setVerifying(true);
    setError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setVerifying(false);
    if (error) {
      setError(error.message);
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
          <h1 className="mt-1 text-xl font-semibold text-text">Enter your code</h1>
          <p className="mt-2 text-sm text-muted">
            Open your authenticator app and enter the current 6-digit code.
          </p>
        </div>

        <form onSubmit={handleVerify} className="card space-y-4">
          <div>
            <label htmlFor="code" className="mb-1 block text-sm text-muted">
              6-digit code
            </label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest text-text outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-overdue">{error}</p>}
          <button type="submit" disabled={verifying || !factorId} className="btn-primary w-full">
            {verifying ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
