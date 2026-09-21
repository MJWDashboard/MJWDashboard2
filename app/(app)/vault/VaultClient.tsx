"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { FileText, ShieldCheck, KeyRound, Scale, Plus, Trash2, X, CheckCircle2 } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import { formatZAR } from "@/lib/money";
import {
  createDocument,
  deleteDocument,
  createPolicy,
  deletePolicy,
  createCredential,
  deleteCredential,
  createMatter,
  updateMatterContact,
  closeMatter,
  deleteMatter,
} from "./actions";

type Document = Tables<"documents">;
type Policy = Tables<"policies">;
type Credential = Tables<"credentials">;
type Matter = Tables<"matters">;

const TABS = ["Documents", "Policies", "Credentials", "Open matters"] as const;
const DOC_TYPES = ["bank_statement", "will", "insurance", "warranty", "tax", "medical", "vehicle", "property", "legal", "other"];

export function VaultClient({
  documents,
  policies,
  credentials,
  matters,
}: {
  documents: Document[];
  policies: Policy[];
  credentials: Credential[];
  matters: Matter[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Documents");

  return (
    <div className="space-y-4">
      <PageHeader
        icon={ShieldCheck}
        color={NAV_ITEMS.find((n) => n.href === "/vault")!.color}
        eyebrow="Vault"
        title="Documents, policies & the estate file"
      />

      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              tab === t ? "bg-accent text-white" : "border border-border text-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Documents" && <DocumentsTab documents={documents} />}
      {tab === "Policies" && <PoliciesTab policies={policies} />}
      {tab === "Credentials" && <CredentialsTab credentials={credentials} />}
      {tab === "Open matters" && <MattersTab matters={matters} />}
    </div>
  );
}

function DocumentsTab({ documents }: { documents: Document[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add document
      </button>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet" detail="Track document metadata — bank statements, the will, warranties, tax records." />
      ) : (
        documents.map((d) => {
          const expiring = d.expiry_date && new Date(d.expiry_date) < new Date(Date.now() + 45 * 86400000);
          return (
            <div key={d.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{d.doc_type.replace("_", " ")} {d.issuer && `· ${d.issuer}`}</p>
                <p className="text-xs text-muted">
                  {d.document_date && new Date(d.document_date).toLocaleDateString("en-ZA")}
                  {d.expiry_date && ` · expires ${new Date(d.expiry_date).toLocaleDateString("en-ZA")}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {expiring && <span className="status-pill-soon">Expiring</span>}
                <button onClick={() => startTransition(() => deleteDocument(d.id))} className="text-muted hover:text-overdue">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <DocumentForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function DocumentForm({ onClose }: { onClose: () => void }) {
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [issuer, setIssuer] = useState("");
  const [docDate, setDocDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await createDocument({
        doc_type: docType,
        issuer: issuer.trim() || null,
        document_date: docDate || null,
        expiry_date: expiryDate || null,
        reference_number: reference.trim() || null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New document" onClose={onClose}>
      <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        {DOC_TYPES.map((t) => (
          <option key={t} value={t}>{t.replace("_", " ")}</option>
        ))}
      </select>
      <input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="Issuer" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={docDate} onChange={(e) => setDocDate(e.target.value)} type="date" placeholder="Document date" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} type="date" placeholder="Expiry date" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference number" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <p className="text-xs text-muted">Reference numbers are stored as plain text, protected by row-level security — not yet field-encrypted.</p>
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save document</button>
    </FormSheet>
  );
}

function PoliciesTab({ policies }: { policies: Policy[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();
  const totalPremiums = policies.reduce((sum, p) => sum + Number(p.premium ?? 0), 0);

  return (
    <div className="space-y-2">
      {policies.length > 0 && (
        <div className="card flex items-center justify-between">
          <span className="text-xs text-muted">Total monthly premiums</span>
          <span data-sensitive className="tabular text-sm font-medium text-text">{formatZAR(totalPremiums)}</span>
        </div>
      )}

      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add policy
      </button>

      {policies.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No policies yet" detail="Life, funeral, vehicle, household, medical aid." />
      ) : (
        policies.map((p) => {
          const renewing = p.renewal_date && new Date(p.renewal_date) < new Date(Date.now() + 45 * 86400000);
          return (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{p.insurer} · {p.kind.replace("_", " ")}</p>
                <p className="text-xs text-muted">
                  {p.premium != null && <span data-sensitive>{formatZAR(Number(p.premium))}/mo</span>}
                  {p.renewal_date && ` · renews ${new Date(p.renewal_date).toLocaleDateString("en-ZA")}`}
                  {!p.beneficiary && " · no beneficiary on file"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {renewing && <span className="status-pill-soon">Renewing</span>}
                {!p.beneficiary && <span className="status-pill-overdue">No beneficiary</span>}
                <button onClick={() => startTransition(() => deletePolicy(p.id))} className="text-muted hover:text-overdue">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <PolicyForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function PolicyForm({ onClose }: { onClose: () => void }) {
  const [insurer, setInsurer] = useState("");
  const [kind, setKind] = useState("life");
  const [premium, setPremium] = useState("");
  const [cover, setCover] = useState("");
  const [renewal, setRenewal] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!insurer.trim()) return;
    startTransition(async () => {
      await createPolicy({
        insurer: insurer.trim(),
        kind,
        policy_number: null,
        premium: premium ? Number(premium) : null,
        cover_amount: cover ? Number(cover) : null,
        renewal_date: renewal || null,
        beneficiary: beneficiary.trim() || null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New policy" onClose={onClose}>
      <input value={insurer} onChange={(e) => setInsurer(e.target.value)} placeholder="Insurer" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        <option value="life">Life</option>
        <option value="funeral">Funeral</option>
        <option value="vehicle">Vehicle</option>
        <option value="household">Household</option>
        <option value="medical_aid">Medical aid</option>
        <option value="other">Other</option>
      </select>
      <div className="flex gap-2">
        <input value={premium} onChange={(e) => setPremium(e.target.value)} type="number" placeholder="Monthly premium" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={cover} onChange={(e) => setCover(e.target.value)} type="number" placeholder="Cover amount" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={renewal} onChange={(e) => setRenewal(e.target.value)} type="date" placeholder="Renewal date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} placeholder="Beneficiary" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save policy</button>
    </FormSheet>
  );
}

function CredentialsTab({ credentials }: { credentials: Credential[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">
        A register only — 2FA method and last change date. Passwords themselves live in a dedicated password manager, never here.
      </p>
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add account
      </button>

      {credentials.length === 0 ? (
        <EmptyState icon={KeyRound} title="No accounts registered" detail="Bank, email and company accounts are Tier 1 — track their 2FA and password age." />
      ) : (
        credentials.map((c) => {
          const stale = c.last_password_change && new Date(c.last_password_change) < new Date(Date.now() - 365 * 86400000);
          const tier1Risk = c.criticality === "tier1" && (stale || !c.two_fa_method);
          return (
            <div key={c.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{c.service}</p>
                <p className="text-xs text-muted">
                  {c.criticality === "tier1" ? "Tier 1" : "Tier 2"} {c.two_fa_method && `· ${c.two_fa_method}`}
                  {c.last_password_change && ` · changed ${new Date(c.last_password_change).toLocaleDateString("en-ZA")}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {tier1Risk && <span className="status-pill-overdue">Review</span>}
                <button onClick={() => startTransition(() => deleteCredential(c.id))} className="text-muted hover:text-overdue">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <CredentialForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function CredentialForm({ onClose }: { onClose: () => void }) {
  const [service, setService] = useState("");
  const [username, setUsername] = useState("");
  const [criticality, setCriticality] = useState<"tier1" | "tier2">("tier1");
  const [twoFa, setTwoFa] = useState("");
  const [lastChange, setLastChange] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!service.trim()) return;
    startTransition(async () => {
      await createCredential({
        service: service.trim(),
        username: username.trim() || null,
        criticality,
        two_fa_method: twoFa.trim() || null,
        last_password_change: lastChange || null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New account" onClose={onClose}>
      <input value={service} onChange={(e) => setService(e.target.value)} placeholder="Service (e.g. ABSA, Gmail)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username / email" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <select value={criticality} onChange={(e) => setCriticality(e.target.value as "tier1" | "tier2")} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        <option value="tier1">Tier 1 (bank, email, company)</option>
        <option value="tier2">Tier 2</option>
      </select>
      <input value={twoFa} onChange={(e) => setTwoFa(e.target.value)} placeholder="2FA method (e.g. authenticator app)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={lastChange} onChange={(e) => setLastChange(e.target.value)} type="date" placeholder="Last password change" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save account</button>
    </FormSheet>
  );
}

function MattersTab({ matters }: { matters: Matter[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();
  const open = matters.filter((m) => m.status === "open");
  const closed = matters.filter((m) => m.status === "closed");

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add matter
      </button>

      {open.length === 0 ? (
        <EmptyState icon={Scale} title="No open matters" detail="The estate file, SARS, Master of the High Court, Public Protector references." />
      ) : (
        open.map((m) => {
          const stale = !m.last_contact || new Date(m.last_contact) < new Date(Date.now() - 14 * 86400000);
          return (
            <div key={m.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text">{m.matter}</p>
                <button onClick={() => startTransition(() => deleteMatter(m.id))} className="text-muted hover:text-overdue">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-xs text-muted">
                {m.authority} {m.reference && `· ref ${m.reference}`}
              </p>
              {m.next_action && <p className="text-xs text-text">Next: {m.next_action}</p>}
              <div className="flex items-center justify-between border-t border-border pt-2">
                {stale ? <span className="status-pill-overdue">No contact 14+ days</span> : <span className="status-pill-ok">Up to date</span>}
                <div className="flex gap-3 text-xs">
                  <button onClick={() => startTransition(() => updateMatterContact(m.id))} className="text-accent">Log contact</button>
                  <button onClick={() => startTransition(() => closeMatter(m.id))} className="text-muted">Close</button>
                </div>
              </div>
            </div>
          );
        })
      )}

      {closed.length > 0 && (
        <details className="text-xs text-muted">
          <summary>{closed.length} closed</summary>
          <div className="mt-2 space-y-1">
            {closed.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <CheckCircle2 size={12} /> {m.matter}
              </div>
            ))}
          </div>
        </details>
      )}

      {showForm && <MatterForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function MatterForm({ onClose }: { onClose: () => void }) {
  const [matter, setMatter] = useState("");
  const [authority, setAuthority] = useState("");
  const [reference, setReference] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!matter.trim()) return;
    startTransition(async () => {
      await createMatter({
        reference: reference.trim() || null,
        matter: matter.trim(),
        authority: authority.trim() || null,
        next_action: nextAction.trim() || null,
        due_date: dueDate || null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New matter" onClose={onClose}>
      <input value={matter} onChange={(e) => setMatter(e.target.value)} placeholder="Matter (e.g. Estate file)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="Authority (e.g. SARS, Master of the High Court)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference number" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next action" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save matter</button>
    </FormSheet>
  );
}

function FormSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 lg:rounded-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text">{title}</p>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
