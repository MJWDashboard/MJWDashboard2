"use client";

import { useRouter } from "next/navigation";
import { BUILDING_COOKIE } from "@/lib/building-cookie";

export function BuildingSelector({ buildings, selected }: { buildings: { id: string; name: string; building_code: string | null }[]; selected: string }) {
  const router = useRouter();

  function onChange(value: string) {
    document.cookie = `${BUILDING_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  const safeSelected = selected === "all" || buildings.some((b) => b.id === selected) ? selected : "all";

  return (
    <select className="input w-auto min-w-48 py-1.5 text-sm" value={safeSelected} onChange={(e) => onChange(e.target.value)} aria-label="Building">
      <option value="all">All Buildings</option>
      {buildings.map((b) => <option key={b.id} value={b.id}>{b.building_code ? `${b.building_code} · ` : ""}{b.name}</option>)}
    </select>
  );
}
