"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteToPortfolio } from "./actions";
import { PORTFOLIO_ROLE_OPTIONS, PORTFOLIO_ROLE_LABEL, type PortfolioRole } from "./roles";

export function InviteForm({ portfolioId, portfolioName }: { portfolioId: string; portfolioName: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PortfolioRole>("team_member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await inviteToPortfolio({ email, portfolioId, portfolioRole: role });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(
      result.grantedImmediately
        ? `${email} already has an account - access to ${portfolioName} was granted immediately.`
        : `Invitation created for ${email}. They'll get access as soon as they sign up.`
    );
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="text-sm font-semibold text-charcoal-100">Invite Someone to {portfolioName}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Role</label>
          <select
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as PortfolioRole)}
          >
            {PORTFOLIO_ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-cyan-400">{success}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Sending…" : "Send Invitation"}
        </button>
      </div>
    </form>
  );
}
