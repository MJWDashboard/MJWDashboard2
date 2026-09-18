"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, Badge } from "@/components/StatusBadge";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { enumLabel } from "@/lib/status";
import { addTenantNote, addTenantContact, removeTenantContact, renewLease, type RenewLeaseInput } from "../actions";
import { useRouter } from "next/navigation";
import { DocumentLink } from "../../documents/DocumentLink";

const TABS = [
  "Overview",
  "Lease",
  "Financial",
  "Arrears",
  "Turnovers",
  "Contacts",
  "Meetings",
  "Actions",
  "Documents",
  "Notes",
  "History",
] as const;

type Tab = (typeof TABS)[number];

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function TenantProfileTabs({
  tenant,
  leases,
  arrearsCurrent,
  arrearsHistory,
  arrearsComments,
  turnovers,
  annualCertificates,
  tenantContacts,
  availableContacts,
  meetingNotes,
  actions,
  documents,
  tenantNotes,
  emailByUserId,
}: {
  tenant: any;
  leases: any[];
  arrearsCurrent: any;
  arrearsHistory: any[];
  arrearsComments: any[];
  turnovers: any[];
  annualCertificates: any[];
  tenantContacts: any[];
  availableContacts: { id: string; name: string; type: string }[];
  meetingNotes: any[];
  actions: any[];
  documents: any[];
  tenantNotes: any[];
  emailByUserId: Map<string, string>;
}) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 border-b border-charcoal-700">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-md px-3 py-2 text-sm transition-colors ${
              tab === t
                ? "border-b-2 border-cyan-500 text-cyan-400"
                : "text-charcoal-300 hover:text-charcoal-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Snapshot</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Registered Entity" value={tenant.registered_entity} />
              <Row label="Account Number" value={tenant.account_number} />
              <Row label="Monthly Rental" value={formatCurrency(tenant.monthly_rental)} />
              <Row label="Lease End" value={formatDate(tenant.lease_end)} />
              <Row
                label="Current Arrears"
                value={formatCurrency(arrearsCurrent?.current_balance ?? 0)}
              />
            </dl>
          </section>
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Compliance</h2>
            <div className="flex flex-wrap gap-2">
              <Badge
                label={`FICA: ${enumLabel(tenant.fica_status)}`}
                className={
                  tenant.fica_status === "received"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }
              />
              <Badge
                label={`Insurance: ${enumLabel(tenant.insurance_status)}`}
                className={
                  tenant.insurance_status === "received"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }
              />
              <Badge
                label={tenant.lease_signed ? "Lease Signed" : "Lease Not Signed"}
                className={
                  tenant.lease_signed
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }
              />
              <Badge
                label={tenant.deposit_received ? "Deposit Received" : "Deposit Outstanding"}
                className={
                  tenant.deposit_received
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }
              />
            </div>
          </section>
        </div>
      )}

      {tab === "Lease" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Current Terms</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Lease Start" value={formatDate(tenant.lease_start)} />
              <Row label="Lease End" value={formatDate(tenant.lease_end)} />
              <Row label="Option Period" value={tenant.option_period} />
              <Row label="Escalation %" value={tenant.escalation_pct ? `${tenant.escalation_pct}%` : null} />
              <Row label="Escalation Date" value={formatDate(tenant.escalation_date)} />
            </dl>
          </section>
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Security</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Deposit Amount" value={formatCurrency(tenant.deposit_amount)} />
              <Row label="Deposit Type" value={tenant.deposit_type} />
              <Row label="Bank Guarantee Ref" value={tenant.bank_guarantee_reference} />
              <Row label="Surety Name" value={tenant.surety_name} />
              <Row label="Surety Expiry" value={formatDate(tenant.surety_expiry)} />
            </dl>
          </section>
          <section className="card lg:col-span-2">
            <RenewLeaseForm tenantId={tenant.id} buildingId={tenant.building_id} currentLease={tenant} />
          </section>
          <section className="card lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold">Lease History</h2>
            {leases.length > 0 ? (
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Start</th>
                    <th>End</th>
                    <th>Base Rental</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leases.map((l) => (
                    <tr key={l.id}>
                      <td>{formatDate(l.lease_start)}</td>
                      <td>{formatDate(l.lease_end)}</td>
                      <td>{formatCurrency(l.base_rental)}</td>
                      <td>
                        <StatusBadge status={l.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-charcoal-400">No lease records.</p>
            )}
          </section>
        </div>
      )}

      {tab === "Financial" && (
        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Monthly Charges</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
            <Row label="Base Rental" value={formatCurrency(tenant.monthly_rental)} />
            <Row label="Operating Costs" value={formatCurrency(tenant.operating_costs)} />
            <Row label="Rates" value={formatCurrency(tenant.rates)} />
            <Row label="Marketing" value={formatCurrency(tenant.marketing_charge)} />
            <Row label="Other Charges" value={formatCurrency(tenant.other_charges)} />
            <Row label="Turnover %" value={tenant.turnover_pct ? `${tenant.turnover_pct}%` : null} />
          </dl>
        </section>
      )}

      {tab === "Arrears" && (
        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Current Position</h2>
            {arrearsCurrent ? (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
                <Row label="Balance" value={formatCurrency(arrearsCurrent.current_balance)} />
                <Row label="30 Days" value={formatCurrency(arrearsCurrent.days_30)} />
                <Row label="60 Days" value={formatCurrency(arrearsCurrent.days_60)} />
                <Row label="90+ Days" value={formatCurrency(arrearsCurrent.days_90_plus)} />
              </dl>
            ) : (
              <p className="text-sm text-charcoal-400">No current arrears record.</p>
            )}
          </section>
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Comment History</h2>
            {arrearsComments.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {arrearsComments.map((c) => (
                  <li key={c.id}>
                    <p className="text-xs text-charcoal-400">{formatDateTime(c.created_at)}</p>
                    <p>{c.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-charcoal-400">No comments yet.</p>
            )}
          </section>
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Monthly History</h2>
            {arrearsHistory.length > 0 ? (
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {arrearsHistory.map((h, i) => (
                    <tr key={i}>
                      <td>{formatDate(h.as_of_month)}</td>
                      <td>{formatCurrency(h.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-charcoal-400">No history yet.</p>
            )}
          </section>
        </div>
      )}

      {tab === "Turnovers" && (
        <div className="space-y-6">
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Monthly Submissions</h2>
            {turnovers.length > 0 ? (
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Turnover</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {turnovers.map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.period)}</td>
                      <td>{formatCurrency(t.turnover_amount)}</td>
                      <td>{formatDate(t.due_date)}</td>
                      <td>
                        <Badge label={enumLabel(t.status)} className="bg-charcoal-600/60 text-charcoal-200" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-charcoal-400">No turnover records.</p>
            )}
          </section>
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Annual Certificates</h2>
            {annualCertificates.length > 0 ? (
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Financial Year</th>
                    <th>Due</th>
                    <th>Received</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {annualCertificates.map((c) => (
                    <tr key={c.id}>
                      <td>{c.financial_year}</td>
                      <td>{formatDate(c.due_date)}</td>
                      <td>{formatDate(c.received_at)}</td>
                      <td>
                        <Badge label={enumLabel(c.status)} className="bg-charcoal-600/60 text-charcoal-200" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-charcoal-400">
                {tenant.annual_turnover_required
                  ? "No annual certificates recorded yet."
                  : "Annual certificate not required for this tenant."}
              </p>
            )}
          </section>
          {tenant.financial_year_end_month && (
            <p className="text-xs text-charcoal-400">
              Financial year end: {tenant.financial_year_end_day}{" "}
              {MONTH_NAMES[tenant.financial_year_end_month]}
            </p>
          )}
        </div>
      )}

      {tab === "Contacts" && (
        <ContactsTab
          tenantId={tenant.id}
          tenantContacts={tenantContacts}
          availableContacts={availableContacts}
        />
      )}

      {tab === "Meetings" && (
        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Meeting Mentions</h2>
          {meetingNotes.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {meetingNotes.map((n) => (
                <li key={n.id}>
                  <div className="flex items-center justify-between">
                    <Link href={`/dashboard/meetings/${n.meeting_id}`} className="text-cyan-400 hover:underline">
                      {n.meetings?.title ?? "Meeting"}
                    </Link>
                    <span className="text-xs text-charcoal-400">{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="text-charcoal-300">{n.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No meeting mentions yet.</p>
          )}
        </section>
      )}

      {tab === "Actions" && (
        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Action Items</h2>
          {actions.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {actions.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span>{a.title}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No action items.</p>
          )}
        </section>
      )}

      {tab === "Documents" && (
        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Documents</h2>
          {documents.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {documents.map((d) => (
                <li key={d.id}>
                  <DocumentLink path={d.file_path} fileName={d.file_name} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-400">No documents uploaded for this tenant.</p>
          )}
        </section>
      )}

      {tab === "Notes" && <NotesTab tenantId={tenant.id} notes={tenantNotes} emailByUserId={emailByUserId} />}

      {tab === "History" && (
        <section className="card">
          <h2 className="mb-4 text-sm font-semibold">Record History</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Created" value={formatDateTime(tenant.created_at)} />
            <Row label="Created By" value={emailByUserId.get(tenant.created_by) ?? tenant.created_by ?? "—"} />
            <Row label="Last Updated" value={formatDateTime(tenant.updated_at)} />
            <Row label="Updated By" value={emailByUserId.get(tenant.updated_by) ?? tenant.updated_by ?? "—"} />
          </dl>
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-charcoal-800 py-1 last:border-b-0">
      <dt className="text-charcoal-400">{label}</dt>
      <dd className="text-right text-charcoal-100">{value ?? "—"}</dd>
    </div>
  );
}

function RenewLeaseForm({
  tenantId,
  buildingId,
  currentLease,
}: {
  tenantId: string;
  buildingId: string;
  currentLease: any;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RenewLeaseInput>({
    lease_start: "",
    lease_end: "",
    option_period: currentLease.option_period ?? "",
    monthly_rental: currentLease.monthly_rental ?? "",
    escalation_pct: currentLease.escalation_pct ?? "",
    escalation_date: "",
  });
  const router = useRouter();

  function set<K extends keyof RenewLeaseInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lease_start || !form.lease_end) {
      setError("Lease start and end dates are required.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await renewLease(tenantId, buildingId, form);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Renew Lease</h2>
        <button onClick={() => setOpen(true)} className="btn-secondary">
          Renew Lease
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold">Renew Lease</h2>
      <p className="mb-4 text-xs text-charcoal-400">
        This creates a new lease record and retires the current one. Shop, security, compliance and turnover
        terms carry forward unchanged - only the fields below are new.
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">New Lease Start</label>
          <input
            type="date"
            className="input"
            value={form.lease_start}
            onChange={(e) => set("lease_start", e.target.value)}
          />
        </div>
        <div>
          <label className="label">New Lease End</label>
          <input
            type="date"
            className="input"
            value={form.lease_end}
            onChange={(e) => set("lease_end", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Option Period</label>
          <input
            className="input"
            value={form.option_period}
            onChange={(e) => set("option_period", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Monthly Rental</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.monthly_rental}
            onChange={(e) => set("monthly_rental", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Escalation %</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.escalation_pct}
            onChange={(e) => set("escalation_pct", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Escalation Date</label>
          <input
            type="date"
            className="input"
            value={form.escalation_date}
            onChange={(e) => set("escalation_date", e.target.value)}
          />
        </div>
        {error && <p className="col-span-full text-sm text-red-400">{error}</p>}
        <div className="col-span-full flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : "Confirm Renewal"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotesTab({
  tenantId,
  notes,
  emailByUserId,
}: {
  tenantId: string;
  notes: any[];
  emailByUserId: Map<string, string>;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await addTenantNote(tenantId, text);
    setLoading(false);
    setText("");
    router.refresh();
  }

  return (
    <section className="card">
      <h2 className="mb-4 text-sm font-semibold">Notes</h2>
      <form onSubmit={handleSubmit} className="mb-5 space-y-3 border-b border-charcoal-700 pb-5">
        <textarea
          rows={2}
          className="input"
          placeholder="Add a note - relationship history, negotiations, disputes…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : "Add Note"}
          </button>
        </div>
      </form>
      {notes.length > 0 ? (
        <ul className="space-y-3 text-sm">
          {notes.map((n) => (
            <li key={n.id}>
              <p className="text-xs text-charcoal-400">
                {formatDateTime(n.created_at)} · {emailByUserId.get(n.created_by) ?? "Unknown"}
              </p>
              <p>{n.note}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-charcoal-400">No notes yet.</p>
      )}
    </section>
  );
}

const ROLE_OPTIONS = ["primary", "owner", "director", "financial", "accounts", "operational", "emergency", "other"];

function ContactsTab({
  tenantId,
  tenantContacts,
  availableContacts,
}: {
  tenantId: string;
  tenantContacts: any[];
  availableContacts: { id: string; name: string; type: string }[];
}) {
  const [contactId, setContactId] = useState("");
  const [role, setRole] = useState("primary");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!contactId) return;
    setLoading(true);
    await addTenantContact({ tenant_id: tenantId, contact_id: contactId, role, notes: "" });
    setLoading(false);
    setContactId("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    await removeTenantContact(id, tenantId);
    router.refresh();
  }

  return (
    <section className="card">
      <h2 className="mb-4 text-sm font-semibold">Tenant Contacts</h2>
      <form onSubmit={handleAdd} className="mb-5 flex flex-wrap items-end gap-3 border-b border-charcoal-700 pb-5">
        <div>
          <label className="label">Contact</label>
          <select className="input w-56" value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">Select a contact</option>
            {availableContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input w-40 capitalize" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading || !contactId} className="btn-primary">
          {loading ? "Adding…" : "Add"}
        </button>
      </form>

      {tenantContacts.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {tenantContacts.map((tc) => (
            <li key={tc.id} className="flex items-center justify-between">
              <div>
                <span className="font-medium">{tc.contacts?.name}</span>
                <span className="ml-2 text-xs capitalize text-charcoal-400">{tc.role}</span>
                <span className="ml-2 text-xs text-charcoal-400">
                  {tc.contacts?.email ?? tc.contacts?.phone ?? ""}
                </span>
              </div>
              <button onClick={() => handleRemove(tc.id)} className="text-xs text-red-400 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-charcoal-400">No contacts linked yet.</p>
      )}
    </section>
  );
}
