import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/StatusBadge";
import { ContactFormButton } from "./ContactForm";

export default async function ContactsPage() {
  const supabase = createClient();

  const [{ data: contacts }, { data: buildings }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, type, company, email, phone, building_id, notes, buildings(name)")
      .is("archived_at", null)
      .order("name"),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  const buildingOptions = buildings ?? [];

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${contacts?.length ?? 0} contacts`}
        action={<ContactFormButton label="+ Add Contact" buildings={buildingOptions} />}
      />

      {contacts && contacts.length > 0 ? (
        <div className="table-shell">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Building</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td>
                    <Badge label={c.type} className="bg-charcoal-600/60 text-charcoal-200 capitalize" />
                  </td>
                  <td>{c.company ?? "—"}</td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.buildings?.name ?? "—"}</td>
                  <td className="text-right">
                    <ContactFormButton contact={c} label="Edit" buildings={buildingOptions} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No contacts yet" />
      )}
    </div>
  );
}
