import type { Tables } from "@/lib/supabase/database.types";

type Medicine = Tables<"medicines">;
type MedDose = Tables<"med_doses">;

export type ChecklistEntry = {
  medicine: Medicine;
  timeSlot: string;
  dose: MedDose | null;
};

const SLOT_ORDER = ["morning", "midday", "evening", "bedtime"];

export function todaysChecklist(medicines: Medicine[], doses: MedDose[], today: string): ChecklistEntry[] {
  const entries: ChecklistEntry[] = [];
  for (const med of medicines.filter((m) => m.active)) {
    for (const slot of med.schedule) {
      const dose = doses.find((d) => d.medicine_id === med.id && d.dose_date === today && d.time_slot === slot) ?? null;
      entries.push({ medicine: med, timeSlot: slot, dose });
    }
  }
  return entries.sort((a, b) => SLOT_ORDER.indexOf(a.timeSlot) - SLOT_ORDER.indexOf(b.timeSlot));
}
