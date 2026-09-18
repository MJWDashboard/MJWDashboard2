export type PortfolioRole =
  | "portfolio_manager"
  | "portfolio_administrator"
  | "administrator"
  | "team_member";

export const PORTFOLIO_ROLE_OPTIONS: { value: PortfolioRole; label: string }[] = [
  { value: "portfolio_manager", label: "Portfolio Manager - full oversight + manages the team" },
  { value: "portfolio_administrator", label: "Portfolio Administrator - full oversight, no team management" },
  { value: "administrator", label: "Administrator - assigned buildings, can delegate within them" },
  { value: "team_member", label: "Team Member - assigned buildings only" },
];

export const PORTFOLIO_ROLE_LABEL: Record<PortfolioRole, string> = {
  portfolio_manager: "Portfolio Manager",
  portfolio_administrator: "Portfolio Administrator",
  administrator: "Administrator",
  team_member: "Team Member",
};

// Roles whose data access is limited to buildings explicitly assigned to them.
export const BUILDING_SCOPED_ROLES: PortfolioRole[] = ["administrator", "team_member"];
