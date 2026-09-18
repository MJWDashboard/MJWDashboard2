import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ExportButton } from "@/components/ExportButton";
import { FilterChip } from "@/components/FilterChip";
import { ContractorFormButton } from "./ContractorForm";
import { ContractorImportButton } from "./ContractorImport";
import { getSelectedBuilding } from "@/lib/building";

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: { building_id?: string };
}) {
  const supabase = createClient();
  const selectedBuilding = getSelectedBuilding();
  const buildingId = searchParams.building_id ?? (selectedBuilding !== "all" ? selectedBuilding : undefined);

  const [{ data: contractors }, { data: buildings }, { data: links }] = await Promise.all([
    supabase
      .from("contractors")
      .select(
        "id, company_name, contact_name, trade, email, phone, alt_phone, vat_number, registration_number, rating, standard_rate, notes"
      )
      .is("archived_at", null)
      .order("company_name"),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
    supabase.from("contractor_buildings").select("contractor_id, building_id, buildings(name)"),
  ]);

  const buildingsByContractor = new Map<string, { id: string; name: string }[]>();
  for (const link of links ?? []) {
    const list = buildingsByContractor.get(link.contractor_id) ?? [];
    list.push({ id: link.building_id, name: (link as any).buildings?.name ?? "—" });
    buildingsByContractor.set(link.contractor_id, list);
  }

  const rows = (contractors ?? []).map((c) => ({
    ...c,
    buildings: buildingsByContractor.get(c.id) ?? [],
  }));

  const filtered = buildingId ? rows.filter((c) => c.buildings.some((b) => b.id === buildingId)) : rows;

  const buildingOptions = buildings ?? [];

  return (
    <div>
      <PageHeader
        title="Contractors"
        description={`${filtered.length} contractors - master database`}
        action={
          <div className="flex gap-3">
            <ExportButton
              filename="contractors"
              sheetName="Contractors"
              rows={filtered.map((c) => ({
                "Company Name": c.company_name ?? "",
                "Contact Name": c.contact_name ?? "",
                Trade: c.trade ?? "",
                Email: c.email ?? "",
                Phone: c.phone ?? "",
                "Alt Phone": c.alt_phone ?? "",
                "VAT Number": c.vat_number ?? "",
                "Registration Number": c.registration_number ?? "",
                Buildings: c.buildings.map((b) => b.name).join(", "),
                Rating: c.rating ?? "",
                "Standard Rate": c.standard_rate ?? "",
                Notes: c.notes ?? "",
              }))}
            />
            <ContractorImportButton buildings={buildingOptions} />
            <ContractorFormButton label="+ Add Contractor" buildings={buildingOptions} />
          </div>
        }
      />

      {buildingId && (
        <FilterChip
          label={buildingOptions.find((b) => b.id === buildingId)?.name ?? "building"}
          clearHref="/dashboard/contractors"
        />
      )}

      {filtered.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Company / Contact</th>
                <th>Trade</th>
                <th>Contact Details</th>
                <th>Buildings</th>
                <th>Rating</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.company_name || c.contact_name || "—"}</td>
                  <td>{c.trade ?? "—"}</td>
                  <td>{c.email ?? c.phone ?? "—"}</td>
                  <td className="max-w-xs">
                    {c.buildings.length > 0 ? c.buildings.map((b) => b.name).join(", ") : "All / Unassigned"}
                  </td>
                  <td>{c.rating ? "★".repeat(c.rating) : "—"}</td>
                  <td className="text-right">
                    <ContractorFormButton
                      contractor={{ ...c, buildingIds: c.buildings.map((b) => b.id) }}
                      label="Edit"
                      buildings={buildingOptions}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No contractors yet" description="Import a spreadsheet or add a contractor manually." />
      )}
    </div>
  );
}
