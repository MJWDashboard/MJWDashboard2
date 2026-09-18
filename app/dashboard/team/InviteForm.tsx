"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteToPortfolio } from "./actions";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner - works on their own portfolio" },
  { value: "partner", label: "Partner - co-manages the portfolio" },
  { value: "administrator", label: "Administrator - full portfolio admin" },
];

export function InviteForm({ portfolios }: { portfolios: { id: string; name: string }[] }) {
  const [email, setEmail] = useState("");
  const [portfolioId, setPortfolioId] = useState("");
  const [role, setRole] = useState("owner");
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
        ? `${email} already has an account - access to this portfolio was granted immediately.`
        : `Invitation created for ${email}. They'll get access as soon as they sign up.`
    );
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-sm font-semibold text-charcoal-100">Invite Someone</h2>
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
        <div>
          <label className="label">Portfolio</label>
          <select
            required
            className="input"
            value={portfolioId}
            onChange={(e) => setPortfolioId(e.target.value)}
          >
            <option value="" disabled>
              Select a portfolio
            </option>
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((r) => (
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
        <button type="submit" disabled={loading || portfolios.length === 0} className="btn-primary">
          {loading ? "Sending…" : "Send Invitation"}
        </button>
      </div>
    </form>
  );
}
