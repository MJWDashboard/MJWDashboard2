"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/PageHeader";

type Factor = { id: string; friendly_name: string | null; status: string };

function SecurityPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mfaRequired = searchParams.get("mfa_required") === "1";

  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [needsChallenge, setNeedsChallenge] = useState(false);

  const [enrolling, setEnrolling] = useState(false);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: factorsData }, { data: aal }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    setFactors((factorsData?.totp ?? []) as Factor[]);
    setNeedsChallenge(!!aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2");
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleStartEnroll() {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEnrollFactorId(data.id);
    setQrSvg(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEnrolling(true);
  }

  async function handleVerifyEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollFactorId) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enrollFactorId,
    });
    if (challengeError) {
      setBusy(false);
      setError(challengeError.message);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollFactorId,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setEnrolling(false);
    setCode("");
    setSuccess("Two-factor authentication is now active on your account.");
    await refresh();
    router.refresh();
  }

  async function handleCompleteChallenge(e: React.FormEvent) {
    e.preventDefault();
    const factor = factors[0];
    if (!factor) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });
    if (challengeError) {
      setBusy(false);
      setError(challengeError.message);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code,
    });
    setBusy(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setCode("");
    router.push("/dashboard");
    router.refresh();
  }

  async function handleRemove(factorId: string) {
    if (!confirm("Remove two-factor authentication? You'll be prompted to set it up again if your role requires it.")) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    await refresh();
    router.refresh();
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Security" description="Two-factor authentication" />
        <p className="text-sm text-charcoal-400">Loading…</p>
      </div>
    );
  }

  // Case 1: a factor exists but this session hasn't completed the challenge yet.
  if (needsChallenge) {
    return (
      <div className="mx-auto max-w-sm">
        <PageHeader title="Verify Your Identity" description="Enter the 6-digit code from your authenticator app" />
        <form onSubmit={handleCompleteChallenge} className="card space-y-4">
          <input
            required
            autoFocus
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            className="input text-center text-lg tracking-widest"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Verifying…" : "Verify"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Security" description="Two-factor authentication" />

      {mfaRequired && factors.length === 0 && (
        <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          Your role requires two-factor authentication before you can access the rest of the dashboard. Set it up below.
        </div>
      )}

      {success && <p className="mb-4 text-sm text-cyan-400">{success}</p>}

      {factors.length > 0 ? (
        <div className="card space-y-3">
          <p className="text-sm text-charcoal-200">Two-factor authentication is enabled on your account.</p>
          {factors.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm">
              <span className="text-charcoal-300">{f.friendly_name ?? "Authenticator app"}</span>
              <button onClick={() => handleRemove(f.id)} disabled={busy} className="text-xs text-red-400 hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : enrolling ? (
        <form onSubmit={handleVerifyEnroll} className="card space-y-4">
          <p className="text-sm text-charcoal-200">
            Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter the
            6-digit code it generates.
          </p>
          {qrSvg && (
            <div
              className="mx-auto w-48 rounded bg-white p-2"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
          {secret && (
            <p className="break-all text-center text-xs text-charcoal-400">
              Can&apos;t scan? Enter this key manually: <span className="text-charcoal-200">{secret}</span>
            </p>
          )}
          <input
            required
            autoFocus
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            className="input text-center text-lg tracking-widest"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEnrolling(false);
                setError(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Verifying…" : "Enable"}
            </button>
          </div>
        </form>
      ) : (
        <div className="card space-y-4">
          <p className="text-sm text-charcoal-300">
            Two-factor authentication adds a second step at login using an authenticator app on your phone, in
            addition to your password.
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button onClick={handleStartEnroll} disabled={busy} className="btn-primary">
            {busy ? "Starting…" : "Enable Two-Factor Authentication"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SecurityPage() {
  return (
    <Suspense fallback={null}>
      <SecurityPageInner />
    </Suspense>
  );
}
