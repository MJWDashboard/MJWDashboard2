import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ContractorFormButton } from "./ContractorForm";

export default async function ContractorsPage() {
  const supabase = createClient();

  const [{ data: contractors }, { data: contacts }, { data: buildings }] = await Promise.all([
    supabase
      .from("contractors")
      .select("id, trade, rating, contact_id, building_id, contacts(name, email, phone), buildings(name)")
      .is("archived_at", null),
    supabase.from("contacts").select("id, name").is("archived_at", null).order("name"),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  return (
    <div>
      <PageHeader
        title="Contractors"
        description={`${contractors?.length ?? 0} contractors`}
        action={
          <ContractorFormButton
            label="+ Add Contractor"
            contacts={contacts ?? []}
            buildings={buildings ?? []}
          />
        }
      />

      {contractors && contractors.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Trade</th>
                <th>Contact</th>
                <th>Building</th>
                <th>Rating</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contractors.map((c: any) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.contacts?.name ?? "—"}</td>
                  <td>{c.trade ?? "—"}</td>
                  <td>{c.contacts?.email ?? c.contacts?.phone ?? "—"}</td>
                  <td>{c.buildings?.name ?? "—"}</td>
                  <td>{c.rating ? "★".repeat(c.rating) : "—"}</td>
                  <td className="text-right">
                    <ContractorFormButton
                      contractor={c}
                      label="Edit"
                      contacts={contacts ?? []}
                      buildings={buildings ?? []}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No contractors yet" />
      )}
    </div>
  );
}
