import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ExportButton } from "@/components/ExportButton";
import { ContactFormButton } from "./ContactForm";
import { ContactImportButton } from "./ContactImport";
import { ContactsTable } from "./ContactsTable";
import { getSelectedBuilding } from "@/lib/building";

export default async function ContactsPage() {
  const supabase = createClient();
  const selectedBuilding = getSelectedBuilding();

  const [{ data: contacts }, { data: buildings }] = await Promise.all([
    (() => {
      let query = supabase
      .from("contacts")
      .select(
        "id, name, type, company, email, phone, office_number, emergency_number, after_hours_number, building_id, active, notes, buildings(name)"
      )
      .is("archived_at", null)
      .order("name");
      if (selectedBuilding !== "all") query = query.eq("building_id", selectedBuilding);
      return query;
    })(),
    supabase.from("buildings").select("id, name").is("archived_at", null).order("name"),
  ]);

  const buildingOptions = buildings ?? [];

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${contacts?.length ?? 0} contacts - the address book for every building`}
        action={
          <div className="flex gap-3">
            <ExportButton
              filename="contacts"
              sheetName="Contacts"
              rows={(contacts ?? []).map((c: any) => ({
                Name: c.name,
                Type: c.type,
                Company: c.company,
                Email: c.email,
                Cell: c.phone,
                Office: c.office_number,
                Emergency: c.emergency_number,
                "After Hours": c.after_hours_number,
                Building: c.buildings?.name,
                Active: c.active,
              }))}
            />
            <ContactImportButton buildings={buildingOptions} />
            <ContactFormButton label="+ Add Contact" buildings={buildingOptions} />
          </div>
        }
      />

      {contacts && contacts.length > 0 ? (
        <ContactsTable contacts={contacts as any} buildings={buildingOptions} />
      ) : (
        <EmptyState title="No contacts yet" description="Add a contact or import from Excel." />
      )}
    </div>
  );
}
