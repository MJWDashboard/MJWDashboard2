// A controlled list so documents can be filtered and reported on
// consistently, rather than free text drifting into near-duplicate labels.
export const DOCUMENT_CATEGORIES = [
  "Lease",
  "Compliance",
  "Insurance",
  "Municipal",
  "Financial",
  "Contract",
  "Building Plan",
  "Site Plan",
  "Correspondence",
  "Other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
