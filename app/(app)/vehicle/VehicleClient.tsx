"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Car, Fuel, Plus, Trash2, Wrench, X, MapPin } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { AttachmentGallery } from "@/components/AttachmentGallery";
import { NAV_ITEMS } from "@/lib/nav";
import { costPerKm } from "@/lib/vehicle";
import { formatZAR } from "@/lib/money";
import {
  createVehicle,
  deleteVehicle,
  addFuelLog,
  deleteFuelLog,
  addService,
  deleteService,
  addTrip,
  deleteTrip,
} from "./actions";

type Vehicle = Tables<"vehicles">;
type FuelLog = Tables<"fuel_logs">;
type Trip = Tables<"trips">;
type Service = Tables<"services">;
type Attachment = Tables<"attachments">;

const TABS = ["Fuel", "Trips", "Services"] as const;

export function VehicleClient({
  vehicles,
  fuelLogs,
  trips,
  services,
  receipts,
}: {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  trips: Trip[];
  services: Service[];
  receipts: Attachment[];
}) {
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(vehicles[0]?.id ?? null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Fuel");

  if (vehicles.length === 0) {
    return (
      <div className="space-y-4">
        <Header />
        <EmptyState icon={Car} title="No vehicles yet" detail="Add a vehicle to start logging fuel and services." />
        <button onClick={() => setShowVehicleForm(true)} className="btn-primary w-full">
          <Plus size={14} /> Add vehicle
        </button>
        {showVehicleForm && <VehicleForm onClose={() => setShowVehicleForm(false)} />}
      </div>
    );
  }

  const active = vehicles.find((v) => v.id === activeId) ?? vehicles[0];
  const vehicleFuelLogs = fuelLogs.filter((f) => f.vehicle_id === active.id);
  const vehicleTrips = trips.filter((t) => t.vehicle_id === active.id);
  const vehicleServices = services.filter((s) => s.vehicle_id === active.id);
  const stats = costPerKm(vehicleFuelLogs);

  return (
    <div className="space-y-4">
      <Header />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {vehicles.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveId(v.id)}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
              v.id === active.id ? "bg-accent text-white" : "border border-border text-muted"
            )}
          >
            {v.make} {v.model}
          </button>
        ))}
        <button onClick={() => setShowVehicleForm(true)} className="shrink-0 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted">
          + Vehicle
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">{active.make} {active.model} {active.year ?? ""}</p>
            <p className="text-xs text-muted">{active.registration ?? "No registration on file"} · {Math.round(active.odometer).toLocaleString()} km</p>
          </div>
          <button onClick={() => deleteVehicle(active.id)} className="text-muted hover:text-overdue">
            <Trash2 size={14} />
          </button>
        </div>
        {stats && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
            <div>
              <p className="text-xs text-muted">Cost per km</p>
              <p data-sensitive className="tabular text-sm font-medium text-text">{formatZAR(stats.costPerKm)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">L/100km</p>
              <p className="tabular text-sm font-medium text-text">{stats.litresPer100km.toFixed(1)}</p>
            </div>
          </div>
        )}
      </div>

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

      {tab === "Fuel" && <FuelTab vehicleId={active.id} logs={vehicleFuelLogs} receipts={receipts} />}
      {tab === "Trips" && <TripsTab vehicleId={active.id} trips={vehicleTrips} />}
      {tab === "Services" && <ServicesTab vehicleId={active.id} services={vehicleServices} />}

      {showVehicleForm && <VehicleForm onClose={() => setShowVehicleForm(false)} />}
    </div>
  );
}

function Header() {
  return (
    <PageHeader
      icon={Car}
      color={NAV_ITEMS.find((n) => n.href === "/vehicle")!.color}
      eyebrow="Vehicle & Travel"
      title="Your vehicles"
    />
  );
}

function VehicleForm({ onClose }: { onClose: () => void }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [registration, setRegistration] = useState("");
  const [odometer, setOdometer] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!make.trim() || !model.trim()) return;
    startTransition(async () => {
      await createVehicle({
        make: make.trim(),
        model: model.trim(),
        year: year ? Number(year) : null,
        registration: registration.trim() || null,
        fuel_type: "petrol",
        odometer: odometer ? Number(odometer) : 0,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="New vehicle" onClose={onClose}>
      <div className="flex gap-2">
        <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <div className="flex gap-2">
        <input value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder="Year" className="w-24 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="Registration" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={odometer} onChange={(e) => setOdometer(e.target.value)} type="number" placeholder="Current odometer (km)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save vehicle</button>
    </FormSheet>
  );
}

function FuelTab({ vehicleId, logs, receipts }: { vehicleId: string; logs: FuelLog[]; receipts: Attachment[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Log fill-up
      </button>
      {logs.length === 0 ? (
        <EmptyState icon={Fuel} title="No fuel logs yet" detail="Log full-tank fill-ups to unlock cost-per-km." />
      ) : (
        logs.map((log) => (
          <div key={log.id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text">{log.litres}L · {formatZAR(Number(log.total))}</p>
                <p className="text-xs text-muted">
                  {new Date(log.occurred_at).toLocaleDateString("en-ZA")} · {Math.round(log.odometer).toLocaleString()} km
                  {!log.full_tank && " · partial"}
                </p>
              </div>
              <button onClick={() => startTransition(() => deleteFuelLog(log.id))} className="text-muted hover:text-overdue">
                <Trash2 size={14} />
              </button>
            </div>
            <AttachmentGallery
              recordTable="fuel_logs"
              recordId={log.id}
              attachments={receipts.filter((r) => r.record_id === log.id)}
            />
          </div>
        ))
      )}
      {showForm && <FuelForm vehicleId={vehicleId} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function FuelForm({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const [litres, setLitres] = useState("");
  const [total, setTotal] = useState("");
  const [odometer, setOdometer] = useState("");
  const [fullTank, setFullTank] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [pending, startTransition] = useTransition();

  function save() {
    if (!litres || !total || !odometer) return;
    startTransition(async () => {
      await addFuelLog({
        vehicle_id: vehicleId,
        occurred_at: date,
        litres: Number(litres),
        price_per_litre: Number(total) / Number(litres),
        total: Number(total),
        odometer: Number(odometer),
        full_tank: fullTank,
        station: null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="Log fuel fill-up" onClose={onClose}>
      <div className="flex gap-2">
        <input value={litres} onChange={(e) => setLitres(e.target.value)} type="number" placeholder="Litres" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={total} onChange={(e) => setTotal(e.target.value)} type="number" placeholder="Total (R)" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={odometer} onChange={(e) => setOdometer(e.target.value)} type="number" placeholder="Odometer (km)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={fullTank} onChange={(e) => setFullTank(e.target.checked)} />
        Filled to full (needed for accurate cost per km)
      </label>
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save fill-up</button>
    </FormSheet>
  );
}

function TripsTab({ vehicleId, trips }: { vehicleId: string; trips: Trip[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Log trip
      </button>
      {trips.length === 0 ? (
        <EmptyState icon={MapPin} title="No trips logged" detail="Business/private trips, built to SARS logbook fields." />
      ) : (
        trips.map((trip) => (
          <div key={trip.id} className="card flex items-center justify-between">
            <div>
              <p className="text-sm text-text">{trip.from_location} → {trip.to_location}</p>
              <p className="text-xs text-muted">
                {new Date(trip.occurred_at).toLocaleDateString("en-ZA")} · {trip.purpose}
                {trip.odometer_start != null && trip.odometer_end != null && ` · ${trip.odometer_end - trip.odometer_start} km`}
              </p>
            </div>
            <button onClick={() => startTransition(() => deleteTrip(trip.id))} className="text-muted hover:text-overdue">
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
      {showForm && <TripForm vehicleId={vehicleId} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function TripForm({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [odoStart, setOdoStart] = useState("");
  const [odoEnd, setOdoEnd] = useState("");
  const [purpose, setPurpose] = useState<"business" | "private">("private");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await addTrip({
        vehicle_id: vehicleId,
        occurred_at: date,
        from_location: from.trim() || null,
        to_location: to.trim() || null,
        odometer_start: odoStart ? Number(odoStart) : null,
        odometer_end: odoEnd ? Number(odoEnd) : null,
        purpose,
        reimbursed: false,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="Log trip" onClose={onClose}>
      <div className="flex gap-2">
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <div className="flex gap-2">
        <input value={odoStart} onChange={(e) => setOdoStart(e.target.value)} type="number" placeholder="Odo start" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={odoEnd} onChange={(e) => setOdoEnd(e.target.value)} type="number" placeholder="Odo end" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <div className="flex gap-2">
        <select value={purpose} onChange={(e) => setPurpose(e.target.value as "business" | "private")} className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text">
          <option value="private">Private</option>
          <option value="business">Business</option>
        </select>
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save trip</button>
    </FormSheet>
  );
}

function ServicesTab({ vehicleId, services }: { vehicleId: string; services: Service[] }) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button onClick={() => setShowForm(true)} className="btn-secondary w-full">
        <Plus size={14} /> Log service
      </button>
      {services.length === 0 ? (
        <EmptyState icon={Wrench} title="No services logged" detail="Track services, repairs and their next-due date." />
      ) : (
        services.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <p className="text-sm text-text">{s.provider ?? "Service"}</p>
              <p className="text-xs text-muted">
                {new Date(s.occurred_at).toLocaleDateString("en-ZA")}
                {s.cost != null && ` · ${formatZAR(Number(s.cost))}`}
                {s.next_due_date && ` · next due ${new Date(s.next_due_date).toLocaleDateString("en-ZA")}`}
              </p>
            </div>
            <button onClick={() => startTransition(() => deleteService(s.id))} className="text-muted hover:text-overdue">
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
      {showForm && <ServiceForm vehicleId={vehicleId} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function ServiceForm({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const [provider, setProvider] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextDueDate, setNextDueDate] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await addService({
        vehicle_id: vehicleId,
        occurred_at: date,
        odometer: null,
        provider: provider.trim() || null,
        work_done: workDone.trim() || null,
        cost: cost ? Number(cost) : null,
        next_due_odometer: null,
        next_due_date: nextDueDate || null,
      });
      onClose();
    });
  }

  return (
    <FormSheet title="Log service" onClose={onClose}>
      <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <input value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="Work done" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <div className="flex gap-2">
        <input value={cost} onChange={(e) => setCost(e.target.value)} type="number" placeholder="Cost" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      </div>
      <input value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} type="date" placeholder="Next due date" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-accent" />
      <button onClick={save} disabled={pending} className="btn-primary w-full">Save service</button>
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
