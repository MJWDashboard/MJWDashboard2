# Vorexa Property Management Dashboard

Vorexa's Property Management Dashboard. Next.js 14 (App Router) + Supabase,
built against the live multi-tenant schema in Supabase project
`eaxyxsrsljdonkravpoj`.

Public marketing/sign-in landing page lives at `/`; the authenticated app
lives under `/dashboard/*`.

## What's built

- **Database** — live in Supabase project `eaxyxsrsljdonkravpoj`: multi-tenant
  via `organizations` / `organization_users` / `organization_invitations`,
  buildings, contacts, contractors, tenants, leases, leasing_deals,
  arrears_current / arrears_history / arrears_comments (balance-overwrite,
  comments-persist model), turnovers, action_items, meetings, meeting_notes,
  important_dates, site_visits, documents (+ a private `documents` storage
  bucket), knowledge_base_articles, faults, audit_log. Every table has
  created/updated/archived audit columns, and RLS is enabled and
  **organization-scoped** — each user only sees their organization's data.

- **Auth** — Supabase email/password auth with session middleware
  (`middleware.ts`, `lib/supabase/middleware.ts`). New sign-ups are
  auto-attached to an organization: they accept a pending
  `organization_invitations` row if one exists for their email, or become
  admin of the (single) existing organization if no one has signed up yet.
  Users without an organization see a "waiting for an invitation" screen.

- **App shell** — sidebar nav, portfolio selector (cookie-persisted filter
  across Buildings/Dashboard), dark charcoal / cyan design system
  (`tailwind.config.ts`).

- **Every module has a live, Supabase-backed list page with working
  Add/Edit forms**: Dashboard, Buildings, Tenants, Leasing, Arrears,
  Turnovers, Actions, Meetings, Calendar, Site Visits, Documents,
  Contractors, Contacts, Reports (index), Knowledge Base.

- **Detail workspaces**: `/buildings/[id]` (the one-screen meeting view —
  tenants, open actions, arrears, recent site visits) and `/tenants/[id]`
  (lease history, arrears history, open actions, turnover trend).

- **Meeting Mode** (`/meetings/[id]`) — live note capture tagged to a
  tenant, "Convert to action" turns a note straight into an action item
  linked to that meeting/building/tenant, plus a one-click meeting-pack
  PDF export.

- **Arrears timeline** — click a tenant on the Arrears page to open a
  comment-history drawer without leaving the list, with follow-up dates,
  promise-to-pay tracking and escalation flags.

- **Excel** — Tenants page has a real import flow: upload .xlsx/.csv, it
  previews row counts (new / update / needs review) before anything
  commits, matching by building + tenant name. Buildings, Tenants and
  Arrears pages export the current view to .xlsx.

- **PDF export** — Arrears report, tenant schedule and meeting packs export
  to PDF via `jspdf` + `jspdf-autotable`.

- **Full calendar grid view** — `/calendar` is a real month grid (not a
  table), with important dates shown per day and inline add/edit.

- **Portfolio Knowledge Base** — `/knowledge-base` holds free-form articles
  (portfolio-wide or per-building) plus a "Generate Handover Summary"
  action that auto-compiles a building's tenants, arrears, open actions,
  contacts and contractors into a shareable summary.

## Not yet built

- Document previews inline (currently opens a signed URL in a new tab)
- Full audit log viewer UI (the `audit_log` table is populated but has no
  dedicated page yet)
- Fine-grained roles/permissions UI (roles exist in `organization_users`
  but aren't yet enforced differently in the UI beyond membership)

## Local setup

```bash
npm install
cp .env.local.example .env.local
# then paste your Supabase anon key into .env.local
npm run dev
```

Get the anon key from Supabase dashboard → Project Settings → API →
`anon` `public` key, for project `eaxyxsrsljdonkravpoj`.


## Deploying

Connect this repo in Vercel and add the two env vars from `.env.local` in
the Vercel project settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
