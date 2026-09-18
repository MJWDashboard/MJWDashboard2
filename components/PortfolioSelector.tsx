"use client";

import { useRouter } from "next/navigation";
import { PORTFOLIO_COOKIE } from "@/lib/portfolio-cookie";
import { BUILDING_COOKIE } from "@/lib/building-cookie";

export function PortfolioSelector({
  portfolios,
  selected,
}: {
  portfolios: { id: string; name: string }[];
  selected: string;
}) {
  const router = useRouter();

  function onChange(value: string) {
    document.cookie = `${PORTFOLIO_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
    document.cookie = `${BUILDING_COOKIE}=all; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <select
      className="input w-auto py-1.5 text-sm"
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="all">All Portfolios</option>
      {portfolios.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
