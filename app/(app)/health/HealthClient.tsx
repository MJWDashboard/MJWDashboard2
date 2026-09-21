"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { CheckCircle2, Circle, RotateCcw, Pill, Plus, Trash2, Pencil, X, Stethoscope, Scale, HeartPulse } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import { todaysChecklist } from "@/lib/health";
import { formatZAR } from "@/lib/money";
import {
  createMedicine,
  updateMedicine,
  deleteMedicine,
  logDose,
  resetDose,
  createAppointment,
  updateAppointment,
  toggleAppointmentCompleted,
  deleteAppointment,
  logWeight,
  updateWeightEntry,
  deleteWeightEntry,
} from "./actions";

type Medicine = Tables<"medicines">;
type MedDose = Tables<"med_doses">;
type Appointment = Tables<"appointments">;
type HealthMetric = Tables<"health_metrics">;

const SLOTS = ["morning", "midday", "evening", "bedtime"] as const;
const TABS = ["Today", "Medicines", "Appointments", "Weight"] as const;

export function HealthClient({
  medicines,
  doses,
  appointments,
  weights,
  today,
}: {
  medicines: Medicine[];
  doses: MedDose[];
  appointments: Appointment[];
  weights: HealthMetric[];
  today: string;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Today");

  return (
    <div className="space-y-4">
      <PageHeader
        icon={HeartPulse}
        color={NAV_ITEMS.find((n) => n.href === "/health")!.color}
        eyebrow="Health"
        title="Doses, appointments & trends"
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

      {tab === "Today" && <ChecklistTab medicines={medicines} doses={doses} today={today} />}
      {tab === "Medicines" && <MedicinesTab medicines={medicines} />}
      {tab === "Appointments" && <AppointmentsTab appointments={appointments} />}
      {tab === "Weight" && <WeightTab weights={weights} />}
    </div>
  );
}

function ChecklistTab({ medicines, doses, today }: { medicines: Medicine[]; doses: MedDose[]; today: string }) {
  const checklist = todaysChecklist(medicines, doses, today);
  const [, startTransition] = useTransition();

  if (checklist.length === 0) {
    return <EmptyState icon={Pill} title="No doses scheduled" detail="Add a medicine with a schedule to see today's checklist." />;
  }

  const taken = checklist.filter((c) => c.dose?.status === "taken").length;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">{taken} of {checklist.length} taken today</p>
      {checklist.map((entry) => (
        <div key={`${entry.medicine.id}-${entry.timeSlot}`} className="card flex items-center justify-between">
          <div>
            <p className="text-sm text-text">{entry.medicine.name} {entry.medicine.strength}</p>
            <p className="text-xs capitalize text-muted">{entry.timeSlot} {entry.medicine.dose_text && `· ${entry.medicine.dose_text}`}</p>
          </div>
          <div className="flex items-center gap-2">
            {entry.dose?.status === "taken" ? (
              <>
                <span className="status-pill-ok">Taken</span>
                <button
                  onClick={() => startTransition(() => resetDose(entry.medicine.id, entry.timeSlot))}
                  className="text-muted hover:text-text"
                  aria-label="Undo"
                >
                  <RotateCcw size={14} />
                </button>
              </>
            ) : entry.dose?.status === "skipped" ? (
              <>
                <span className="status-pill-soon">Skipped</span>
                <button
                  onClick={() => startTransition(() => resetDose(entry.medicine.id, entry.timeSlot))}
                  className="text-muted hover:text-text"
                  aria-label="Undo"
                >
                  <RotateCcw size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => startTransition(() => logDose(entry.medicine.id, entry.timeSlot, "taken"))}
                  className="text-ok"
                  aria-label="Mark taken"
                >
                  <CheckCircle2 size={22} />
                </button>
                <button
                  onClick={() => startTransition(() => logDose(entry.medicine.id, entry.timeSlot, "skipped"))}
                  className="text-muted"
                  aria-label="Skip"
                >
                  <Circle size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MedicinesTab({ medicines }: { medicines: Medicine[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add medicine
      </button>

      {medicines.length === 0 ? (
        <EmptyState icon={Pill} title="No medicines yet" detail="Add a medicine with its schedule and stock on hand." />
      ) : (
        medicines.map((med) => {
          const lowStock = med.stock_on_hand <= 7;
          const scriptExpiring = med.script_expiry && new Date(med.script_expiry) < new Date(Date.now() + 14 * 86400000);
          return (
            <div key={med.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{med.name} {med.strength}</p>
                <p className="text-xs text-muted">
                  {med.schedule.join(", ")} · {med.stock_on_hand} in stock
                  {med.pharmacy && ` · ${med.pharmacy}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {lowStock && <span className="status-pill-overdue">Low stock</span>}
                {scriptExpiring && <span className="status-pill-soon">Script expiring</span>}
                <button onClick={() => setEditing(med)} className="text-muted hover:text-text" aria-label="Edit medicine">
                  <Pencil size={14} />
                </button>
                <button onClick={() => startTransition(() => deleteMedicine(med.id))} className="text-muted hover:text-overdue" aria-label="Delete medicine">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <MedicineForm onClose={() => setShowForm(false)} />}
      {editing && <MedicineForm medicine={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function MedicineForm({ medicine, onClose }: { medicine?: Medicine; onClose: () => void }) {
  const [name, setName] = useState(medicine?.name ?? "");
  const [strength, setStrength] = useState(medicine?.strength ?? "");
  const [doseText, setDoseText] = useState(medicine?.dose_text ?? "");
  const [schedule, setSchedule] = useState<string[]>(medicine?.schedule ?? ["morning"]);
  const [stock, setStock] = useState(medicine?.stock_on_hand?.toString() ?? "30");
  const [pharmacy, setPharmacy] = useState(medicine?.pharmacy ?? "");
  const [scriptExpiry, setScriptExpiry] = useState(medicine?.script_expiry ?? "");
  const [pending, startTransition] = useTransition();

  function toggleSlot(slot: string) {
    setSchedule((s) => (s.includes(slot) ? s.filter((x) => x !== slot) : [...s, slot]));
  }

  function save() {
    if (!name.trim() || schedule.length === 0) return;
    startTransition(async () => {
      const fields = {
        name: name.trim(),
        strength: strength.trim() || null,
        dose_text: doseText.trim() || null,
        schedule,
        stock_on_hand: Number(stock),
        pharmacy: pharmacy.trim() || null,
        script_expiry: scriptExpiry || null,
      };
      if (medicine) {
        await updateMedicine(medicine.id, fields);
      } else {
        await createMedicine({ ...fields, monthly_collection_date: null });
      }
      onClose();
    });
  }

  return (
    <FormSheet title={medicine ? "Edit medicine" : "New medicine"} onClose={onClose}>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="Strength" className="w-24 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={doseText} onChange={(e) => setDoseText(e.target.value)} placeholder="Dose (e.g. 1 tablet with food)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex flex-wrap gap-2">
        {SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => toggleSlot(slot)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-xs capitalize",
              schedule.includes(slot) ? "bg-accent text-white" : "border border-border text-muted"
            )}
          >
            {slot}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" placeholder="Stock on hand" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={pharmacy} onChange={(e) => setPharmacy(e.target.value)} placeholder="Pharmacy" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Script expiry (optional)</label>
        <input value={scriptExpiry} onChange={(e) => setScriptExpiry(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <button onClick={save} disabled={pending} className="btn-primary w-full">{medicine ? "Save changes" : "Save medicine"}</button>
    </FormSheet>
  );
}

function AppointmentsTab({ appointments }: { appointments: Appointment[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Add appointment
      </button>

      {appointments.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No appointments" detail="Add a doctor or specialist appointment." />
      ) : (
        appointments.map((a) => (
          <div key={a.id} className="card flex items-center justify-between">
            <div>
              <p className={clsx("text-sm", a.completed ? "text-muted line-through" : "text-text")}>{a.provider}</p>
              <p className="text-xs text-muted">
                {new Date(a.appointment_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
                {a.purpose && ` · ${a.purpose}`}
                {a.follow_up_date && ` · follow up ${new Date(a.follow_up_date).toLocaleDateString("en-ZA")}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startTransition(() => toggleAppointmentCompleted(a.id, !a.completed))} className={a.completed ? "text-ok" : "text-muted"}>
                <CheckCircle2 size={18} />
              </button>
              <button onClick={() => setEditing(a)} className="text-muted hover:text-text" aria-label="Edit appointment">
                <Pencil size={14} />
              </button>
              <button onClick={() => startTransition(() => deleteAppointment(a.id))} className="text-muted hover:text-overdue" aria-label="Delete appointment">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}

      {showForm && <AppointmentForm onClose={() => setShowForm(false)} />}
      {editing && <AppointmentForm appointment={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AppointmentForm({ appointment, onClose }: { appointment?: Appointment; onClose: () => void }) {
  const [provider, setProvider] = useState(appointment?.provider ?? "");
  const [purpose, setPurpose] = useState(appointment?.purpose ?? "");
  const [date, setDate] = useState(appointment?.appointment_at?.slice(0, 10) ?? "");
  const [time, setTime] = useState(appointment?.appointment_at ? new Date(appointment.appointment_at).toISOString().slice(11, 16) : "09:00");
  const [cost, setCost] = useState(appointment?.cost?.toString() ?? "");
  const [followUpDate, setFollowUpDate] = useState(appointment?.follow_up_date ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!provider.trim() || !date) return;
    startTransition(async () => {
      const fields = {
        provider: provider.trim(),
        purpose: purpose.trim() || null,
        appointment_at: new Date(`${date}T${time}:00+02:00`).toISOString(),
        follow_up_date: followUpDate || null,
        cost: cost ? Number(cost) : null,
      };
      if (appointment) {
        await updateAppointment(appointment.id, fields);
      } else {
        await createAppointment(fields);
      }
      onClose();
    });
  }

  return (
    <FormSheet title={appointment ? "Edit appointment" : "New appointment"} onClose={onClose}>
      <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" placeholder="Cost (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div>
        <label className="mb-1 block text-xs text-muted">Follow-up date (optional)</label>
        <input value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <button onClick={save} disabled={pending} className="btn-primary w-full">{appointment ? "Save changes" : "Save appointment"}</button>
    </FormSheet>
  );
}

function WeightTab({ weights }: { weights: HealthMetric[] }) {
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState<HealthMetric | null>(null);
  const [pending, startTransition] = useTransition();
  const latest = weights[weights.length - 1];
  const max = Math.max(...weights.map((w) => Number(w.value)), 1);
  const min = Math.min(...weights.map((w) => Number(w.value)), 0);

  function save() {
    if (!value) return;
    startTransition(async () => {
      await logWeight(Number(value));
      setValue("");
    });
  }

  return (
    <div className="space-y-3">
      <div className="card flex items-center gap-2">
        <input value={value} onChange={(e) => setValue(e.target.value)} type="number" placeholder="Log weight (kg)" className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted" />
        <button onClick={save} disabled={pending} className="text-accent"><Plus size={20} /></button>
      </div>

      {weights.length === 0 ? (
        <EmptyState icon={Scale} title="No weight logged" detail="Log your weight to see a 30-day trend." />
      ) : (
        <>
          <div className="card">
            <p className="text-xs text-muted">Latest</p>
            <p data-sensitive className="tabular text-xl font-semibold text-text">{Number(latest.value).toFixed(1)} kg</p>
            <div className="mt-3 flex h-16 items-end gap-1">
              {weights.map((w) => {
                const height = max > min ? ((Number(w.value) - min) / (max - min)) * 100 : 50;
                return <div key={w.id} className="flex-1 rounded-t bg-accent" style={{ height: `${Math.max(8, height)}%` }} />;
              })}
            </div>
          </div>
          <div className="space-y-1">
            {[...weights].reverse().map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs">
                <span className="text-muted">{new Date(w.recorded_at).toLocaleDateString("en-ZA")}</span>
                <div className="flex items-center gap-3">
                  <span data-sensitive className="tabular text-text">{Number(w.value).toFixed(1)} kg</span>
                  <button onClick={() => setEditing(w)} className="text-muted hover:text-text" aria-label="Edit entry">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => startTransition(() => deleteWeightEntry(w.id))} className="text-muted hover:text-overdue" aria-label="Delete entry">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editing && <WeightEditForm entry={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function WeightEditForm({ entry, onClose }: { entry: HealthMetric; onClose: () => void }) {
  const [value, setValue] = useState(entry.value.toString());
  const [date, setDate] = useState(entry.recorded_at);
  const [pending, startTransition] = useTransition();

  function save() {
    if (!value) return;
    startTransition(async () => {
      await updateWeightEntry(entry.id, Number(value), date);
      onClose();
    });
  }

  return (
    <FormSheet title="Edit weight entry" onClose={onClose}>
      <input value={value} onChange={(e) => setValue(e.target.value)} type="number" placeholder="Weight (kg)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save changes</button>
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
