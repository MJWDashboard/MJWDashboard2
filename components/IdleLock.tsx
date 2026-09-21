"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const IDLE_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "touchstart", "keydown", "scroll"] as const;

/** Wraps Health/Vault content: locks the screen after 15 minutes idle and
 * requires the account password to get back in, per the architecture doc. */
export function IdleLock({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [locked, setLocked] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setLocked(true), IDLE_MS);
    }
    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setVerifying(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setVerifying(false);
    if (error) {
      setError("Incorrect password");
      return;
    }
    setPassword("");
    setLocked(false);
  }

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4">
      <form onSubmit={handleUnlock} className="card w-full max-w-sm space-y-4 text-center">
        <Lock className="mx-auto text-accent" size={28} />
        <p className="text-sm font-medium text-text">Locked after 15 minutes idle</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-center text-sm text-text outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-overdue">{error}</p>}
        <button type="submit" disabled={verifying} className="btn-primary w-full">
          {verifying ? "Checking..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}
