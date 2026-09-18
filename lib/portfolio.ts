import { cookies } from "next/headers";

export const PORTFOLIO_COOKIE = "vorexa_portfolio";

export function getSelectedPortfolio(): string {
  return cookies().get(PORTFOLIO_COOKIE)?.value ?? "all";
}
