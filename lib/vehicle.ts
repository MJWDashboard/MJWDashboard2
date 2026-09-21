import type { Tables } from "@/lib/supabase/database.types";

type FuelLog = Tables<"fuel_logs">;

/** Full-to-full method: only usable between two full-tank fill-ups. */
export function costPerKm(logs: FuelLog[]) {
  const fullTanks = logs
    .filter((l) => l.full_tank)
    .sort((a, b) => a.odometer - b.odometer);
  if (fullTanks.length < 2) return null;

  const first = fullTanks[0];
  const last = fullTanks[fullTanks.length - 1];
  const distance = last.odometer - first.odometer;
  if (distance <= 0) return null;

  // Cost of fuel actually used in that distance: every fill-up after the
  // first, since the first tank's fuel gets you to the second full mark.
  const spend = fullTanks.slice(1).reduce((sum, l) => sum + Number(l.total), 0);
  const litresUsed = fullTanks.slice(1).reduce((sum, l) => sum + Number(l.litres), 0);

  return {
    distance,
    costPerKm: spend / distance,
    litresPer100km: (litresUsed / distance) * 100,
  };
}

export function averageConsumption(logs: FuelLog[]) {
  const result = costPerKm(logs);
  return result?.litresPer100km ?? null;
}
