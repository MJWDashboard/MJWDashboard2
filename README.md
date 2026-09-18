# Vorexa Vault

Desktop Property Manager platform for Vorexa. Next.js 14 (App Router) + Supabase.

## What's built

- **Database** — live in Supabase project `eaxyxsrsljdonkravpoj`:
  buildings, contacts, contractors, tenants, leases, leasing_deals,
  arrears_current / arrears_history / arrears_comments (balance-overwrite,
  comments-persist model), turnovers, action_items, meetings, meeting_notes,
  important_dates, site_visits, documents (+ a private `documents` storage
  bucket), audit_log. Every table has created/updated/archived audit columns
  and RLS is enabled (authenticated users have full access — no per-user
  scoping yet, since this is a single-operator tool for now).

- **App shell** — sidebar nav, portfolio selector, dark charcoal / cyan
  design system (`tailwind.config.ts`).

- **Every module has a live list page**: Dashboard, Buildings, Tenants,
  Leasing, Arrears, Turnovers, Actions, Meetings, Calendar (important dates),
  Site Visits, Documents, Contractors, Contacts, Reports (index).

- **Detail workspaces**: `/buildings/[id]` (the one-screen meeting view —
  tenants, open actions, arrears, recent site visits) and `/tenants/[id]`
  (lease info, arrears history, open actions, turnover trend).

- **Meeting Mode** (`/meetings/[id]`) — live note capture tagged to a
  tenant, "Convert to action" turns a note straight into an action item
  linked to that meeting/building/tenant.

- **Arrears timeline** — click a tenant on the Arrears page to see their
  comment history without leaving the list.

- **Excel** — Tenants page has a real import flow: upload .xlsx/.csv,
  it previews row counts (new / update / needs review) before anything
  commits, matching by building + tenant name. Buildings, Tenants and
  Arrears pages export the current view to .xlsx. The same import pattern
  can be extended to Turnovers and Arrears imports next.

## Not yet built

- PDF export (meeting packs, arrears reports, tenant schedules)
- Add/Edit forms for most records — the "+ Add" buttons on several pages
  are placeholders; Tenants import and Meeting Mode notes are the only
  fully wired write paths besides Documents upload
- Portfolio Knowledge Base / handover summaries
- User accounts / auth (currently open to any authenticated Supabase user)
- Full calendar grid view (Calendar page is currently a sorted table)

## Local setup

```bash
npm install
cp .env.local.example .env.local
# then paste your Supabase anon key into .env.local
npm run dev
```

Get the anon key from Supabase dashboard → Project Settings → API →
`anon` `public` key, for project `eaxyxsrsljdonkravpoj`.

## Pushing to GitHub

This was built outside of git. From this folder:

```bash
git init
git add .
git commit -m "Vorexa Vault: schema + full module scaffold + meeting mode + tenant import"
git branch -M main
git remote add origin https://github.com/MJWDashboard/MJWDashboard2.git
git push -u origin main
```

## Deploying

Once pushed, connect the repo in Vercel and add the two env vars from
`.env.local` in the Vercel project settings.
