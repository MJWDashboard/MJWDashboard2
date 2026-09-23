import Link from "next/link";
import { Compass, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LIFE_HUB_ITEMS } from "@/lib/nav";

export const metadata = { title: "Life" };

const DETAIL: Record<string, string> = {
  "/home": "Utilities, maintenance, warranties and household costs.",
  "/pets": "Profiles, care schedules, vet visits and recurring costs.",
  "/vehicle": "Fuel, services, licence renewals and cost per kilometre.",
  "/travel": "Trips, bookings, itineraries and travel documents.",
};

export default function LifePage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={Compass} color="#0FAE9C" eyebrow="Everything outside work and money" title="Life" />
      <div className="grid gap-3 sm:grid-cols-2">
        {LIFE_HUB_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="card flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${item.color}22`, color: item.color }}>
              <item.icon size={22} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{item.label}</p>
              <p className="text-xs text-muted">{DETAIL[item.href]}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
