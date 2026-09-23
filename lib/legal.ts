/** Shared legal/contact constants for Vorexa Core's public pages and footer.
 * Company registration number and Information Officer registration status
 * are not yet finalised — see the notes on the Privacy and POPIA/PAIA pages.
 * Do not invent these details; update here once verified records exist. */
export const VOREXA_SITE_URL = "https://vorexa.co.za";
export const CORE_SITE_URL = "https://core.vorexa.co.za";
export const CONTACT_EMAIL = "mornay@vorexa.co.za";
export const LEGAL_UPDATED = "22 September 2026";

export const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/security", label: "Security" },
  { href: "/popia", label: "POPIA/PAIA" },
  { href: "/contact", label: "Contact" },
] as const;
