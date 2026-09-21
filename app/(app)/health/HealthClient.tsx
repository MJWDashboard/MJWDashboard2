"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { CheckCircle2, Circle, Pill, Plus, Trash2, X, Stethoscope, Scale, HeartPulse } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { NAV_ITEMS } from "@/lib/nav";
import { todaysChecklist } from "@/lib/health";
import { formatZAR } from "@/lib/money";
import {
  createMedicine,
  deleteMedicine,
  logDose,
  createAppointment,
  toggleAppointmentCompleted,
  deleteAppointment,
  logWeight,
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
              <span className="status-pill-ok">Taken</span>
            ) : entry.dose?.status === "skipped" ? (
              <span className="status-pill-soon">Skipped</span>
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
                <button onClick={() => startTransition(() => deleteMedicine(med.id))} className="text-muted hover:text-overdue">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showForm && <MedicineForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function MedicineForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [strength, setStrength] = useState("");
  const [doseText, setDoseText] = useState("");
  const [schedule, setSchedule] = useState<string[]>(["morning"]);
  const [stock, setStock] = useState("30");
  const [pharmacy, setPharmacy] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleSlot(slot: string) {
    setSchedule((s) => (s.includes(slot) ? s.filter((x) => x !== slot) : [...s, slot]));
  }

  function save() {
    if (!name.trim() || schedule.length === 0) return;
    startTransition(async () => {
      await createMedicine({
        name: name.trim(),
        strength: strength.trim() || null,
        dose_text: doseText.trim() || null,
        schedule,
        stock_on_hand: Number(stock),
        pharmacy: pharmacy.trim() || null,
        monthly_collection_date: null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New medicine" onClose={onClose}>
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
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save medicine</button>
    </FormSheet>
  );
}

function AppointmentsTab({ appointments }: { appointments: Appointment[] }) {
  const [showForm, setShowForm] = useState(false);
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
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startTransition(() => toggleAppointmentCompleted(a.id, !a.completed))} className={a.completed ? "text-ok" : "text-muted"}>
                <CheckCircle2 size={18} />
              </button>
              <button onClick={() => startTransition(() => deleteAppointment(a.id))} className="text-muted hover:text-overdue">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}

      {showForm && <AppointmentForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function AppointmentForm({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState("");
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [cost, setCost] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!provider.trim() || !date) return;
    startTransition(async () => {
      await createAppointment({
        provider: provider.trim(),
        purpose: purpose.trim() || null,
        appointment_at: new Date(`${date}T${time}:00+02:00`).toISOString(),
        follow_up_date: null,
        cost: cost ? Number(cost) : null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New appointment" onClose={onClose}>
      <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" placeholder="Cost (optional)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save appointment</button>
    </FormSheet>
  );
}

function WeightTab({ weights }: { weights: HealthMetric[] }) {
  const [value, setValue] = useState("");
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
      )}
    </div>
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
