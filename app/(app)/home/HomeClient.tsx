"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { House, Plus, Trash2, Pencil, X, Wrench, Users, Receipt, ArrowRight } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatZAR } from "@/lib/money";
import {
  createMaintenanceItem,
  updateMaintenanceItem,
  deleteMaintenanceItem,
  createHomeContact,
  updateHomeContact,
  deleteHomeContact,
} from "./actions";

type Maintenance = Tables<"home_maintenance">;
type Contact = Tables<"home_contacts">;
type Bill = Pick<Tables<"recurring_expenses">, "id" | "provider" | "amount" | "frequency" | "next_due_date" | "active">;

const TABS = ["Overview", "Maintenance", "Contacts"] as const;
const FREQUENCY_PER_YEAR: Record<string, number> = { weekly: 52, monthly: 12, quarterly: 4, annual: 1 };

export function HomeClient({ maintenance, contacts, bills }: { maintenance: Maintenance[]; contacts: Contact[]; bills: Bill[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const monthlyBills = bills.reduce((sum, b) => sum + (Number(b.amount) * (FREQUENCY_PER_YEAR[b.frequency] ?? 12)) / 12, 0);
  const openMaintenance = maintenance.filter((m) => m.status !== "complete");

  return (
    <div className="space-y-4">
      <PageHeader icon={House} color="#0FAE9C" eyebrow="Life" title="Home" />

      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx("rounded-full px-3 py-1.5 text-xs font-medium", tab === t ? "bg-accent text-white" : "border border-border text-muted")}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab bills={bills} monthlyBills={monthlyBills} openMaintenance={openMaintenance} contacts={contacts} />}
      {tab === "Maintenance" && <MaintenanceTab items={maintenance} />}
      {tab === "Contacts" && <ContactsTab contacts={contacts} />}
    </div>
  );
}

function OverviewTab({
  bills,
  monthlyBills,
  openMaintenance,
  contacts,
}: {
  bills: Bill[];
  monthlyBills: number;
  openMaintenance: Maintenance[];
  contacts: Contact[];
}) {
  return (
    <div className="space-y-3">
      <div className="card space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-text"><Receipt size={14} /> Bills & subscriptions</p>
          <Link href="/money" className="flex items-center gap-1 text-xs text-accent">
            Manage in Money <ArrowRight size={12} />
          </Link>
        </div>
        <p data-sensitive className="tabular text-lg font-semibold text-text">{formatZAR(monthlyBills)}<span className="text-xs font-normal text-muted"> / month</span></p>
        {bills.length === 0 ? (
          <p className="text-xs text-muted">No active recurring bills tracked yet.</p>
        ) : (
          <div className="space-y-1">
            {bills.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-xs">
                <span className="text-muted">{b.provider}</span>
                <span data-sensitive className="tabular text-text">{formatZAR(Number(b.amount))}/{b.frequency}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-text"><Wrench size={14} /> Open maintenance</p>
        {openMaintenance.length === 0 ? (
          <p className="text-xs text-muted">Nothing outstanding.</p>
        ) : (
          openMaintenance.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <span className="text-text">{m.item}</span>
              <span className={clsx("status-pill", m.status === "scheduled" ? "status-pill-soon" : "status-pill-overdue")}>{m.status}</span>
            </div>
          ))
        )}
      </div>

      <div className="card space-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-text"><Users size={14} /> Emergency & service contacts</p>
        {contacts.length === 0 ? (
          <p className="text-xs text-muted">No contacts saved yet.</p>
        ) : (
          contacts.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center justify-between text-xs">
              <span className="text-text">{c.name}{c.role && ` · ${c.role}`}</span>
              <span className="tabular text-muted">{c.phone}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MaintenanceTab({ items }: { items: Maintenance[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Log maintenance
      </button>

      {items.length === 0 ? (
        <EmptyState icon={Wrench} title="Nothing logged" detail="Track repairs, servicing and contractor work for the house." />
      ) : (
        items.map((m) => (
          <div key={m.id} className="card flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm text-text">{m.item}</p>
              <p className="truncate text-xs text-muted">
                {m.issue || "—"} {m.contractor && `· ${m.contractor}`} · {new Date(m.date_reported).toLocaleDateString("en-ZA")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {m.cost != null && <span data-sensitive className="tabular text-xs text-muted">{formatZAR(Number(m.cost))}</span>}
              <button
                onClick={() => startTransition(async () => { await updateMaintenanceItem(m.id, { status: m.status === "complete" ? "open" : "complete" }); })}
                className={clsx("status-pill", m.status === "complete" ? "status-pill-ok" : m.status === "scheduled" ? "status-pill-soon" : "status-pill-overdue")}
              >
                {m.status}
              </button>
              <button onClick={() => setEditing(m)} className="text-muted hover:text-text" aria-label="Edit"><Pencil size={14} /></button>
              <button onClick={() => startTransition(() => deleteMaintenanceItem(m.id))} className="text-muted hover:text-overdue" aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))
      )}

      {showForm && <MaintenanceForm onClose={() => setShowForm(false)} />}
      {editing && <MaintenanceForm item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function MaintenanceForm({ item, onClose }: { item?: Maintenance; onClose: () => void }) {
  const [itemName, setItemName] = useState(item?.item ?? "");
  const [issue, setIssue] = useState(item?.issue ?? "");
  const [contractor, setContractor] = useState(item?.contractor ?? "");
  const [cost, setCost] = useState(item?.cost?.toString() ?? "");
  const [nextService, setNextService] = useState(item?.next_service_date ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!itemName.trim()) return;
    startTransition(async () => {
      const fields = {
        item: itemName.trim(),
        issue: issue.trim() || null,
        contractor: contractor.trim() || null,
        cost: cost ? Number(cost) : null,
        next_service_date: nextService || null,
      };
      if (item) await updateMaintenanceItem(item.id, fields);
      else await createMaintenanceItem({ ...fields, date_reported: new Date().toISOString().slice(0, 10) });
      onClose();
    });
  }

  return (
    <FormSheet title={item ? "Edit maintenance" : "Log maintenance"} onClose={onClose}>
      <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item (e.g. Geyser)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Issue / work done" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="Contractor" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" placeholder="Cost" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={nextService} onChange={(e) => setNextService(e.target.value)} type="date" placeholder="Next service" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      {item && (
        <div className="flex gap-2">
          <button onClick={() => startTransition(async () => { await deleteMaintenanceItem(item.id); onClose(); })} className="btn-secondary px-3 text-overdue"><Trash2 size={16} /></button>
          <button onClick={save} disabled={pending} className="btn-primary flex-1">Save changes</button>
        </div>
      )}
      {!item && <button onClick={save} disabled={pending} className="btn-primary w-full">Save</button>}
    </FormSheet>
  );
}

function ContactsTab({ contacts }: { contacts: Contact[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add contact
      </button>

      {contacts.length === 0 ? (
        <EmptyState icon={Users} title="No contacts yet" detail="Save plumbers, electricians and other service providers for quick access." />
      ) : (
        contacts.map((c) => (
          <div key={c.id} className="card flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm text-text">{c.name}</p>
              <p className="truncate text-xs text-muted">{c.role} {c.phone && `· ${c.phone}`}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => setEditing(c)} className="text-muted hover:text-text" aria-label="Edit"><Pencil size={14} /></button>
              <button onClick={() => startTransition(() => deleteHomeContact(c.id))} className="text-muted hover:text-overdue" aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          </div>
        ))
      )}

      {showForm && <ContactForm onClose={() => setShowForm(false)} />}
      {editing && <ContactForm contact={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ContactForm({ contact, onClose }: { contact?: Contact; onClose: () => void }) {
  const [name, setName] = useState(contact?.name ?? "");
  const [role, setRole] = useState(contact?.role ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) return;
    startTransition(async () => {
      const fields = { name: name.trim(), role: role.trim() || null, phone: phone.trim() || null, notes: notes.trim() || null };
      if (contact) await updateHomeContact(contact.id, fields);
      else await createHomeContact(fields);
      onClose();
    });
  }

  return (
    <FormSheet title={contact ? "Edit contact" : "New contact"} onClose={onClose}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Plumber)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      {contact && (
        <div className="flex gap-2">
          <button onClick={() => startTransition(async () => { await deleteHomeContact(contact.id); onClose(); })} className="btn-secondary px-3 text-overdue"><Trash2 size={16} /></button>
          <button onClick={save} disabled={pending} className="btn-primary flex-1">Save changes</button>
        </div>
      )}
      {!contact && <button onClick={save} disabled={pending} className="btn-primary w-full">Save contact</button>}
    </FormSheet>
  );
}

function FormSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{title}</p>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
