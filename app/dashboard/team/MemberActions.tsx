"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  revokeInvitation,
  removePortfolioMember,
  updatePortfolioMemberRole,
  assignBuildingToMember,
  unassignBuildingFromMember,
} from "./actions";
import { PORTFOLIO_ROLE_OPTIONS, PORTFOLIO_ROLE_LABEL, BUILDING_SCOPED_ROLES, type PortfolioRole } from "./roles";

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

export type AssignedBuilding = { assignmentId: string; buildingId: string; buildingName: string };
export type BuildingOption = { id: string; name: string };

export function MemberRow({
  portfolioId,
  portfolioUserId,
  userId,
  email,
  role,
  canManageTeam,
  canManageBuildings,
  assignedBuildings,
  availableBuildings,
}: {
  portfolioId: string;
  portfolioUserId: string;
  userId: string;
  email: string;
  role: PortfolioRole;
  canManageTeam: boolean;
  canManageBuildings: boolean;
  assignedBuildings: AssignedBuilding[];
  availableBuildings: BuildingOption[];
}) {
  const [currentRole, setCurrentRole] = useState<PortfolioRole>(role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const showBuildings = BUILDING_SCOPED_ROLES.includes(currentRole);
  const unassignedOptions = availableBuildings.filter(
    (b) => !assignedBuildings.some((ab) => ab.buildingId === b.id)
  );

  async function handleRoleChange(newRole: string) {
    setBusy(true);
    setError(null);
    const result = await updatePortfolioMemberRole(portfolioUserId, newRole as PortfolioRole);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setCurrentRole(newRole as PortfolioRole);
    router.refresh();
  }

  async function handleRemove() {
    if (!confirm("Remove this person's access to this portfolio?")) return;
    setBusy(true);
    await removePortfolioMember(portfolioUserId);
    setBusy(false);
    router.refresh();
  }

  async function handleAddBuilding(buildingId: string) {
    if (!buildingId) return;
    setBusy(true);
    setError(null);
    const result = await assignBuildingToMember({ portfolioId, buildingId, userId });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRemoveBuilding(assignmentId: string) {
    setBusy(true);
    await unassignBuildingFromMember(assignmentId);
    setBusy(false);
    router.refresh();
  }

  return (
    <tr>
      <td>{email}</td>
      <td>
        {canManageTeam ? (
          <select
            className="input w-auto py-1 text-xs"
            value={currentRole}
            disabled={busy}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            {PORTFOLIO_ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {PORTFOLIO_ROLE_LABEL[r.value]}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-charcoal-200">{PORTFOLIO_ROLE_LABEL[currentRole]}</span>
        )}
      </td>
      <td>
        {showBuildings ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {assignedBuildings.length === 0 && (
              <span className="text-xs text-charcoal-500">No buildings assigned</span>
            )}
            {assignedBuildings.map((b) => (
              <span
                key={b.assignmentId}
                className="inline-flex items-center gap-1 rounded-full bg-charcoal-700/60 px-2 py-0.5 text-xs text-charcoal-200"
              >
                {b.buildingName}
                {canManageBuildings && (
                  <button
                    onClick={() => handleRemoveBuilding(b.assignmentId)}
                    disabled={busy}
                    className="text-charcoal-400 hover:text-red-400"
                    aria-label={`Unassign ${b.buildingName}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {canManageBuildings && unassignedOptions.length > 0 && (
              <select
                className="input w-auto py-1 text-xs"
                value=""
                disabled={busy}
                onChange={(e) => handleAddBuilding(e.target.value)}
              >
                <option value="">+ Assign building…</option>
                {unassignedOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <span className="text-xs text-charcoal-500">Full portfolio access</span>
        )}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </td>
      <td className="text-right">
        {canManageTeam && (
          <button onClick={handleRemove} disabled={busy} className="text-xs text-red-400 hover:underline">
            Remove
          </button>
        )}
      </td>
    </tr>
  );
}
