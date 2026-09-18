import { cookies } from "next/headers";
import { PORTFOLIO_COOKIE } from "./portfolio-cookie";

export function getSelectedPortfolio(): string {
  return cookies().get(PORTFOLIO_COOKIE)?.value ?? "all";
}
