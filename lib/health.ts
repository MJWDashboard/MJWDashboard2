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

/** Standard BMI (kg / m²). Returns null without both a weight and a
 * recorded height — never estimated. */
export function calculateBmi(weightKg: number, heightCm: number | null): number | null {
  if (!heightCm) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
