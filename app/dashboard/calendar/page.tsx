import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { CalendarGrid } from "./CalendarGrid";
import { ImportantDateFormButton } from "./ImportantDateForm";
import { getSelectedBuilding } from "@/lib/building";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const supabase = createClient();
  const selectedBuilding = getSelectedBuilding();

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month)) {
    const [y, m] = searchParams.month.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const rangeStart = new Date(year, month, 1).toISOString().slice(0, 10);
  const rangeEnd = new Date(year, month + 1, 1).toISOString().slice(0, 10);

  let eventsQuery = supabase
      .from("important_dates")
      .select("id, title, due_date, status, date_type, building_id, tenant_id, buildings(name), tenants(trading_name)")
      .gte("due_date", rangeStart)
      .lt("due_date", rangeEnd)
      .order("due_date");
  if (selectedBuilding !== "all") eventsQuery = eventsQuery.eq("building_id", selectedBuilding);

  const [{ data: events }, { data: buildings }, { data: tenants }] = await Promise.all([
    eventsQuery,
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase.from("tenants").select("id, trading_name").is("archived_at", null).order("trading_name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Lease expiries, compliance dates and other important dates"
        action={
          <ImportantDateFormButton label="+ Add Date" buildings={buildings ?? []} tenants={tenants ?? []} />
        }
      />

      <CalendarGrid
        year={year}
        month={month}
        events={(events ?? []) as any}
        buildings={buildings ?? []}
        tenants={tenants ?? []}
      />
    </div>
  );
}
