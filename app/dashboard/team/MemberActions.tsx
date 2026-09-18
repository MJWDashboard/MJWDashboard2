"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revokeInvitation, removePortfolioMember, updatePortfolioMemberRole } from "./actions";

const ROLE_OPTIONS = ["owner", "partner", "administrator"];

export function RoleSelect({
  portfolioUserId,
  role,
}: {
  portfolioUserId: string;
  role: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(newRole: string) {
    setLoading(true);
    await updatePortfolioMemberRole(portfolioUserId, newRole);
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      className="input w-auto py-1 text-xs capitalize"
      defaultValue={role}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
    >
      {ROLE_OPTIONS.map((r) => (
        <option key={r} value={r} className="capitalize">
          {r}
        </option>
      ))}
    </select>
  );
}

export function RemoveMemberButton({ portfolioUserId }: { portfolioUserId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!confirm("Remove this person's access to this portfolio?")) return;
    setLoading(true);
    await removePortfolioMember(portfolioUserId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className="text-xs text-red-400 hover:underline">
      {loading ? "Removing…" : "Remove"}
    </button>
  );
}

export function RevokeInvitationButton({ invitationId }: { invitationId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!confirm("Revoke this invitation?")) return;
    setLoading(true);
    await revokeInvitation(invitationId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className="text-xs text-red-400 hover:underline">
      {loading ? "Revoking…" : "Revoke"}
    </button>
  );
}
