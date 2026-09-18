export const SERVICE_TYPE_OPTIONS = [
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "refuse", label: "Refuse / Waste" },
  { value: "landscaping", label: "Landscaping / Gardens" },
  { value: "pest_control", label: "Pest Control" },
  { value: "fire_safety", label: "Fire / Life Safety" },
  { value: "lift_maintenance", label: "Lift / Elevator Maintenance" },
  { value: "general_maintenance", label: "General Maintenance" },
  { value: "other", label: "Other" },
] as const;

export const SERVICE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  SERVICE_TYPE_OPTIONS.map((o) => [o.value, o.label])
);
