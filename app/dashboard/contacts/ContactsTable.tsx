"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/StatusBadge";
import { ContactFormButton, TYPE_OPTIONS } from "./ContactForm";

type Contact = {
  id: string;
  name: string;
  type: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  office_number: string | null;
  emergency_number: string | null;
  after_hours_number: string | null;
  building_id: string | null;
  active: boolean;
  notes: string | null;
  buildings: { name: string } | null;
};

export function ContactsTable({
  contacts,
  buildings,
}: {
  contacts: Contact[];
  buildings: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [mailingListOpen, setMailingListOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (buildingFilter !== "all" && c.building_id !== buildingFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (emergencyOnly && c.type !== "emergency" && !c.emergency_number && !c.after_hours_number) {
        return false;
      }
      if (
        term &&
        !`${c.name} ${c.company ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [contacts, search, buildingFilter, typeFilter, emergencyOnly]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="input w-56"
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
          <option value="all">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select className="input w-auto capitalize" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-charcoal-300">
          <input
            type="checkbox"
            checked={emergencyOnly}
            onChange={(e) => setEmergencyOnly(e.target.checked)}
          />
          Emergency / After-Hours only
        </label>
        <button className="btn-secondary ml-auto" onClick={() => setMailingListOpen((v) => !v)}>
          {mailingListOpen ? "Hide" : "Mailing List"}
        </button>
      </div>

      {mailingListOpen && <MailingList contacts={filtered} />}

      <div className="table-shell">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Company</th>
              <th>Email</th>
              <th>Cell</th>
              <th>Emergency</th>
              <th>Building</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className={c.active ? "" : "opacity-50"}>
                <td className="font-medium">{c.name}</td>
                <td>
                  <Badge label={c.type.replace(/_/g, " ")} className="bg-charcoal-600/60 text-charcoal-200 capitalize" />
                </td>
                <td>{c.company ?? "—"}</td>
                <td>{c.email ?? "—"}</td>
                <td>{c.phone ?? "—"}</td>
                <td>{c.emergency_number ?? c.after_hours_number ?? "—"}</td>
                <td>{c.buildings?.name ?? "—"}</td>
                <td className="text-right">
                  <ContactFormButton contact={c} label="Edit" buildings={buildings} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MailingList({ contacts }: { contacts: Contact[] }) {
  const emails = contacts.map((c) => c.email).filter(Boolean) as string[];
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-charcoal-100">
          {emails.length} email{emails.length === 1 ? "" : "s"} in current filter
        </h3>
        <button onClick={handleCopy} className="btn-secondary" disabled={emails.length === 0}>
          {copied ? "Copied!" : "Copy Emails"}
        </button>
      </div>
      <p className="max-h-24 overflow-y-auto text-xs text-charcoal-400">
        {emails.join(", ") || "No emails in this filter."}
      </p>
    </div>
  );
}
