"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function setUp() {
      // A previous attempt may have left an unverified factor behind; drop
      // it so enroll() below always issues a fresh, valid QR code.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.all ?? []) {
        if (f.factor_type === "totp" && f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
      setLoading(false);
    }
    setUp();
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
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Required</p>
          <h1 className="mt-1 text-xl font-semibold text-text">Set up two-factor authentication</h1>
          <p className="mt-2 text-sm text-muted">
            Health and Vault data are behind this. Scan the code with an authenticator app
            (Authy, Google Authenticator, 1Password).
          </p>
        </div>

        <div className="card space-y-4">
          {loading && <p className="text-sm text-muted">Preparing your QR code...</p>}

          {qrSvg && (
            <div
              className="mx-auto w-48 rounded-md bg-white p-3"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}

          {secret && (
            <p className="break-all text-center font-mono text-xs text-muted">
              Can&apos;t scan? Enter this key: {secret}
            </p>
          )}

          {qrSvg && (
            <form onSubmit={handleVerify} className="space-y-3">
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
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-widest text-text outline-none focus:border-accent"
                />
              </div>
              {error && <p className="text-sm text-overdue">{error}</p>}
              <button type="submit" disabled={verifying} className="btn-primary w-full">
                {verifying ? "Verifying..." : "Verify and continue"}
              </button>
            </form>
          )}

          {error && !qrSvg && <p className="text-sm text-overdue">{error}</p>}
        </div>
      </div>
    </div>
  );
}
