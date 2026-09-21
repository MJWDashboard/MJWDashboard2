import type { Tables } from "@/lib/supabase/database.types";

type Visit = Tables<"pet_visits">;

/** Positive = Garth owes you; negative = you owe Garth. Only unsettled visits count. */
export function settleUpBalance(visits: Visit[]) {
  return visits
    .filter((v) => !v.settled)
    .reduce((sum, v) => {
      const garthShare = (Number(v.cost) * v.split_pct) / 100;
      const ownerShare = Number(v.cost) - garthShare;
      if (v.paid_by === "owner") return sum + garthShare;
      return sum - ownerShare;
    }, 0);
}
