"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { PawPrint, Plus, Trash2, Pencil, X, Stethoscope, Package, CheckCircle2 } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import { settleUpBalance } from "@/lib/pets";
import { formatZAR } from "@/lib/money";
import {
  createPet,
  updatePet,
  deletePet,
  addCareItem,
  updateCareItem,
  markCareDone,
  deleteCareItem,
  addVisit,
  updateVisit,
  toggleVisitSettled,
  deleteVisit,
  createAsset,
  updateAsset,
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
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [careFormPetId, setCareFormPetId] = useState<string | null>(null);
  const [editingCareItem, setEditingCareItem] = useState<CareItem | null>(null);
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
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditingPet(pet)} className="text-muted hover:text-text" aria-label="Edit pet">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => startTransition(() => deletePet(pet.id))} className="text-muted hover:text-overdue" aria-label="Delete pet">
                    <Trash2 size={14} />
                  </button>
                </div>
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
                        <button onClick={() => setEditingCareItem(item)} className="text-muted hover:text-text" aria-label="Edit care schedule">
                          <Pencil size={12} />
                        </button>
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
      {editingPet && <PetForm pet={editingPet} onClose={() => setEditingPet(null)} />}
      {careFormPetId && <CareItemForm petId={careFormPetId} onClose={() => setCareFormPetId(null)} />}
      {editingCareItem && (
        <CareItemForm petId={editingCareItem.pet_id} careItem={editingCareItem} onClose={() => setEditingCareItem(null)} />
      )}
    </div>
  );
}

function PetForm({ pet, onClose }: { pet?: Pet; onClose: () => void }) {
  const [name, setName] = useState(pet?.name ?? "");
  const [species, setSpecies] = useState(pet?.species ?? "dog");
  const [breed, setBreed] = useState(pet?.breed ?? "");
  const [age, setAge] = useState(pet?.estimated_age?.toString() ?? "");
  const [vet, setVet] = useState(pet?.vet ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) return;
    startTransition(async () => {
      const fields = {
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        estimated_age: age ? Number(age) : null,
        vet: vet.trim() || null,
      };
      if (pet) {
        await updatePet(pet.id, fields);
      } else {
        await createPet(fields);
      }
      onClose();
    });
  }

  return (
    <FormSheet title={pet ? "Edit pet" : "New pet"} onClose={onClose}>
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
      <button onClick={save} disabled={pending} className="btn-primary w-full">{pet ? "Save changes" : "Save pet"}</button>
    </FormSheet>
  );
}

function CareItemForm({ petId, careItem, onClose }: { petId: string; careItem?: CareItem; onClose: () => void }) {
  const [kind, setKind] = useState<(typeof CARE_KINDS)[number]>((careItem?.kind as (typeof CARE_KINDS)[number]) ?? "vaccine");
  const [label, setLabel] = useState(careItem?.label ?? "");
  const [interval, setInterval] = useState(careItem?.interval_days?.toString() ?? "365");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!label.trim()) return;
    startTransition(async () => {
      const days = interval ? Number(interval) : null;
      if (careItem) {
        await updateCareItem(careItem.id, { kind, label: label.trim(), interval_days: days });
      } else {
        const nextDue = days ? new Date(Date.now() + days * 86400000).toISOString().slice(0, 10) : null;
        await addCareItem({ pet_id: petId, kind, label: label.trim(), interval_days: days, last_done: null, next_due: nextDue });
      }
      onClose();
    });
  }

  return (
    <FormSheet title={careItem ? "Edit care schedule" : "New care schedule"} onClose={onClose}>
      <select value={kind} onChange={(e) => setKind(e.target.value as (typeof CARE_KINDS)[number])} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
        {CARE_KINDS.map((k) => (
          <option key={k} value={k}>{k.replace("_", " ")}</option>
        ))}
      </select>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Annual vaccination" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={interval} onChange={(e) => setInterval(e.target.value)} type="number" placeholder="Repeat every (days)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">{careItem ? "Save changes" : "Save"}</button>
    </FormSheet>
  );
}

function VisitsTab({ pets, visits }: { pets: Pet[]; visits: Visit[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Visit | null>(null);
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
                <button onClick={() => setEditing(v)} className="text-muted hover:text-text" aria-label="Edit visit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => startTransition(() => deleteVisit(v.id))} className="text-muted hover:text-overdue" aria-label="Delete visit">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <VisitForm pets={pets} onClose={() => setShowForm(false)} />}
      {editing && <VisitForm pets={pets} visit={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function VisitForm({ pets, visit, onClose }: { pets: Pet[]; visit?: Visit; onClose: () => void }) {
  const [petId, setPetId] = useState(visit?.pet_id ?? pets[0]?.id ?? "");
  const [reason, setReason] = useState(visit?.reason ?? "");
  const [cost, setCost] = useState(visit?.cost?.toString() ?? "");
  const [paidBy, setPaidBy] = useState<"owner" | "garth">((visit?.paid_by as "owner" | "garth") ?? "owner");
  const [weight, setWeight] = useState(visit?.weight_kg?.toString() ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!petId || !cost) return;
    startTransition(async () => {
      if (visit) {
        await updateVisit(visit.id, {
          pet_id: petId,
          reason: reason.trim() || null,
          cost: Number(cost),
          paid_by: paidBy,
          weight_kg: weight ? Number(weight) : null,
        });
      } else {
        await addVisit({
          pet_id: petId,
          occurred_at: new Date().toISOString().slice(0, 10),
          reason: reason.trim() || null,
          cost: Number(cost),
          paid_by: paidBy,
          split_pct: 50,
          weight_kg: weight ? Number(weight) : null,
        });
      }
      onClose();
    });
  }

  return (
    <FormSheet title={visit ? "Edit vet visit" : "Log vet visit"} onClose={onClose}>
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
      {!visit && <p className="text-xs text-muted">Split 50/50 by default.</p>}
      <button onClick={save} disabled={pending} className="btn-primary w-full">{visit ? "Save changes" : "Save visit"}</button>
    </FormSheet>
  );
}

function AssetsTab({ assets }: { assets: Asset[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
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
                <button onClick={() => setEditing(a)} className="text-muted hover:text-text" aria-label="Edit asset">
                  <Pencil size={14} />
                </button>
                <button onClick={() => startTransition(() => deleteAsset(a.id))} className="text-muted hover:text-overdue" aria-label="Delete asset">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <AssetForm onClose={() => setShowForm(false)} />}
      {editing && <AssetForm asset={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AssetForm({ asset, onClose }: { asset?: Asset; onClose: () => void }) {
  const [item, setItem] = useState(asset?.item ?? "");
  const [category, setCategory] = useState(asset?.category ?? "");
  const [value, setValue] = useState(asset?.replacement_value?.toString() ?? "");
  const [warranty, setWarranty] = useState(asset?.warranty_expiry ?? "");
  const [insured, setInsured] = useState(asset?.insured ?? false);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!item.trim()) return;
    startTransition(async () => {
      const fields = {
        item: item.trim(),
        category: category.trim() || null,
        replacement_value: value ? Number(value) : null,
        warranty_expiry: warranty || null,
        insured,
      };
      if (asset) {
        await updateAsset(asset.id, fields);
      } else {
        await createAsset({ ...fields, purchase_price: null });
      }
      onClose();
    });
  }

  return (
    <FormSheet title={asset ? "Edit asset" : "New asset"} onClose={onClose}>
      <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={value} onChange={(e) => setValue(e.target.value)} type="number" placeholder="Replacement value" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={warranty} onChange={(e) => setWarranty(e.target.value)} type="date" placeholder="Warranty expiry" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} />
        Insured
      </label>
      <button onClick={save} disabled={pending} className="btn-primary w-full">{asset ? "Save changes" : "Save asset"}</button>
    </FormSheet>
  );
}

function FormSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-border bg-surface p-4">
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
