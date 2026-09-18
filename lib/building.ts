import { cookies } from "next/headers";
import { BUILDING_COOKIE } from "./building-cookie";

export function getSelectedBuilding(): string {
  return cookies().get(BUILDING_COOKIE)?.value ?? "all";
}
