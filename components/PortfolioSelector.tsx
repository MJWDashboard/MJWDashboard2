"use client";

import { useRouter } from "next/navigation";
import { PORTFOLIO_COOKIE } from "@/lib/portfolio-cookie";

export function PortfolioSelector({
  portfolios,
  selected,
}: {
  portfolios: string[];
  selected: string;
}) {
  const router = useRouter();

  function onChange(value: string) {
    document.cookie = `${PORTFOLIO_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
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
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
