"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { PawPrint, Plus, Trash2, X, Stethoscope, Package, CheckCircle2 } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import { settleUpBalance } from "@/lib/pets";
import { formatZAR } from "@/lib/money";
import {
  createPet,
  deletePet,
  addCareItem,
  markCareDone,
  deleteCareItem,
  addVisit,
  toggleVisitSettled,
  deleteVisit,
  createAsset,
  deleteAsset,
} from "./actions";

type Pet = Tables<"pets">;
type CareItem = Tables<"pet_care_items">;
type Visit = Tables<"pet_visits">;
type Asset = Tables<"assets">;

const TABS = ["Pets", "Vet visits", "Assets"] as const;
const CARE_KINDS = ["vaccine", "deworm", "flea_tick", "checkup", "dental", "grooming", "medication"] as const;

export function PetsClient({
  pets,
  careItems,
  visits,
  assets,
}: {
  pets: Pet[];
  careItems: CareItem[];
  visits: Visit[];
  assets: Asset[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Pets");
  const balance = settleUpBalance(visits);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={PawPrint}
        color={NAV_ITEMS.find((n) => n.href === "/pets")!.color}
        eyebrow="Home & Pets"
        title="Prince, Tigger & the home"
      />

      {visits.length > 0 && (
        <div className="card flex items-center justify-between">
          <span className="text-xs text-muted">Settle-up with Garth</span>
          <span data-sensitive className={clsx("tabular text-sm font-medium", balance === 0 ? "text-text" : balance > 0 ? "text-ok" : "text-overdue")}>
            {balance === 0 ? "Even" : balance > 0 ? `Garth owes ${formatZAR(balance)}` : `You owe ${formatZAR(-balance)}`}
          </span>
        </div>
      )}

      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              tab === t ? "bg-accent text-white" : "border border-border text-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Pets" && <PetsTab pets={pets} careItems={careItems} />}
      {tab === "Vet visits" && <VisitsTab pets={pets} visits={visits} />}
      {tab === "Assets" && <AssetsTab assets={assets} />}
    </div>
  );
}

function PetsTab({ pets, careItems }: { pets: Pet[]; careItems: CareItem[] }) {
  const [showForm, setShowForm] = useState(false);
  const [careFormPetId, setCareFormPetId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add pet
      </button>

      {pets.length === 0 ? (
        <EmptyState icon={PawPrint} title="No pets yet" detail="Add Prince and Tigger to start tracking care schedules." />
      ) : (
        pets.map((pet) => {
          const items = careItems.filter((c) => c.pet_id === pet.id);
          return (
            <div key={pet.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">{pet.name}</p>
                  <p className="text-xs text-muted">
                    {pet.species} {pet.breed && `· ${pet.breed}`} {pet.estimated_age != null && `· ~${pet.estimated_age}y`}
                  </p>
                </div>
                <button onClick={() => startTransition(() => deletePet(pet.id))} className="text-muted hover:text-overdue">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-1 border-t border-border pt-2">
                {items.map((item) => {
                  const overdue = item.next_due && new Date(item.next_due) < new Date();
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted">
                        {item.label} {item.next_due && `· due ${new Date(item.next_due).toLocaleDateString("en-ZA")}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {overdue && <span className="status-pill-overdue">Overdue</span>}
                        <button onClick={() => startTransition(() => markCareDone(item.id, item.interval_days))} className="text-accent">
                          <CheckCircle2 size={14} />
                        </button>
                        <button onClick={() => startTransition(() => deleteCareItem(item.id))} className="text-muted hover:text-overdue">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => setCareFormPetId(pet.id)} className="text-xs text-accent">
                  + Add care schedule
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <PetForm onClose={() => setShowForm(false)} />}
      {careFormPetId && <CareItemForm petId={careFormPetId} onClose={() => setCareFormPetId(null)} />}
    </div>
  );
}

function PetForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [vet, setVet] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) return;
    startTransition(async () => {
      await createPet({
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        estimated_age: age ? Number(age) : null,
        vet: vet.trim() || null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New pet" onClose={onClose}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <select value={species} onChange={(e) => setSpecies(e.target.value)} className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
          <option value="dog">Dog</option>
          <option value="cat">Cat</option>
          <option value="other">Other</option>
        </select>
        <input value={age} onChange={(e) => setAge(e.target.value)} type="number" placeholder="Age (years)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Breed" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={vet} onChange={(e) => setVet(e.target.value)} placeholder="Vet (e.g. Tygerberg Animal Hospital)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save pet</button>
    </FormSheet>
  );
}

function CareItemForm({ petId, onClose }: { petId: string; onClose: () => void }) {
  const [kind, setKind] = useState<(typeof CARE_KINDS)[number]>("vaccine");
  const [label, setLabel] = useState("");
  const [interval, setInterval] = useState("365");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!label.trim()) return;
    startTransition(async () => {
      const days = interval ? Number(interval) : null;
      const nextDue = days ? new Date(Date.now() + days * 86400000).toISOString().slice(0, 10) : null;
      await addCareItem({ pet_id: petId, kind, label: label.trim(), interval_days: days, last_done: null, next_due: nextDue });
      onClose();
    });
  }

  return (
    <FormSheet title="New care schedule" onClose={onClose}>
      <select value={kind} onChange={(e) => setKind(e.target.value as (typeof CARE_KINDS)[number])} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        {CARE_KINDS.map((k) => (
          <option key={k} value={k}>{k.replace("_", " ")}</option>
        ))}
      </select>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Annual vaccination" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={interval} onChange={(e) => setInterval(e.target.value)} type="number" placeholder="Repeat every (days)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save</button>
    </FormSheet>
  );
}

function VisitsTab({ pets, visits }: { pets: Pet[]; visits: Visit[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full" disabled={pets.length === 0}>
        <Plus size={14} /> Log vet visit
      </button>

      {visits.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No visits logged" detail="Log a vet visit to start tracking the settle-up with Garth." />
      ) : (
        visits.map((v) => {
          const pet = pets.find((p) => p.id === v.pet_id);
          return (
            <div key={v.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{pet?.name ?? "Pet"} · {v.reason || "Visit"}</p>
                <p className="text-xs text-muted">
                  {new Date(v.occurred_at).toLocaleDateString("en-ZA")} · {formatZAR(Number(v.cost))} paid by {v.paid_by === "owner" ? "you" : "Garth"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startTransition(() => toggleVisitSettled(v.id, !v.settled))}
                  className={clsx("status-pill", v.settled ? "status-pill-ok" : "status-pill-soon")}
                >
                  {v.settled ? "Settled" : "Unsettled"}
                </button>
                <button onClick={() => startTransition(() => deleteVisit(v.id))} className="text-muted hover:text-overdue">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <VisitForm pets={pets} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function VisitForm({ pets, onClose }: { pets: Pet[]; onClose: () => void }) {
  const [petId, setPetId] = useState(pets[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [cost, setCost] = useState("");
  const [paidBy, setPaidBy] = useState<"owner" | "garth">("owner");
  const [weight, setWeight] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!petId || !cost) return;
    startTransition(async () => {
      await addVisit({
        pet_id: petId,
        occurred_at: new Date().toISOString().slice(0, 10),
        reason: reason.trim() || null,
        cost: Number(cost),
        paid_by: paidBy,
        split_pct: 50,
        weight_kg: weight ? Number(weight) : null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="Log vet visit" onClose={onClose}>
      <select value={petId} onChange={(e) => setPetId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        {pets.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" placeholder="Cost" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" placeholder="Weight (kg)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as "owner" | "garth")} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        <option value="owner">You paid</option>
        <option value="garth">Garth paid</option>
      </select>
      <p className="text-xs text-muted">Split 50/50 by default.</p>
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save visit</button>
    </FormSheet>
  );
}

function AssetsTab({ assets }: { assets: Asset[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add asset
      </button>

      {assets.length === 0 ? (
        <EmptyState icon={Package} title="No assets yet" detail="Track what you own — warranties and insurance status included." />
      ) : (
        assets.map((a) => {
          const underInsured = a.replacement_value && !a.insured;
          return (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{a.item}</p>
                <p className="text-xs text-muted">
                  {a.category} {a.warranty_expiry && `· warranty to ${new Date(a.warranty_expiry).toLocaleDateString("en-ZA")}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {underInsured && <span className="status-pill-soon">Uninsured</span>}
                <button onClick={() => startTransition(() => deleteAsset(a.id))} className="text-muted hover:text-overdue">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <AssetForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function AssetForm({ onClose }: { onClose: () => void }) {
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [warranty, setWarranty] = useState("");
  const [insured, setInsured] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!item.trim()) return;
    startTransition(async () => {
      await createAsset({
        item: item.trim(),
        category: category.trim() || null,
        purchase_price: null,
        replacement_value: value ? Number(value) : null,
        warranty_expiry: warranty || null,
        insured,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New asset" onClose={onClose}>
      <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={value} onChange={(e) => setValue(e.target.value)} type="number" placeholder="Replacement value" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={warranty} onChange={(e) => setWarranty(e.target.value)} type="date" placeholder="Warranty expiry" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} />
        Insured
      </label>
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save asset</button>
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
