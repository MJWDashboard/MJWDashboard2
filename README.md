# Vorexa Personal

A private, mobile-first, single-owner dashboard built on Next.js 14 (App
Router) + TypeScript + Supabase, deployed on Vercel. It is deliberately
separate from any multi-tenant platform: its own Supabase project, its own
login, its own Google connection. See the build plan for the full module
map, architecture and phase schedule.

## Phase 0 — Foundations (this state)

- **Database** — Supabase project `eaxyxsrsljdonkravpoj`, schema `public`.
  Shared tables every module will build on: `profiles`, `entities`, `tags`,
  `reminders` (drives the Today watchlist, calendar auto-events and the
  04:30 digest), `attachments`, `audit_log` (append-only), `events`,
  `quick_captures` (the generic capture inbox — later phases claim rows
  into their own tables). Every table is row-level-secured to `owner_id =
  auth.uid()`.
- **Auth** — Supabase email/password with **mandatory** TOTP MFA: a new
  session is forced through `/mfa-setup` (first time) or `/mfa-challenge`
  (returning) before it can reach `/today` or any other route. Create the
  first account from the Supabase dashboard → Authentication → Users →
  Invite user (there is no public sign-up screen).
- **App shell** — sidebar (desktop) / bottom bar + "Life" sheet (mobile)
  navigation across all eight areas, a privacy-blur toggle that hides every
  `data-sensitive` value in one tap, a dark/light theme toggle persisted to
  `profiles`, and a quick-capture sheet (fuel / expense / weight / note /
  shopping item) that queues to `localStorage` when offline and flushes on
  reconnect.
- **Idle lock** — `/health` and `/vault` re-lock after 15 minutes idle and
  require the account password to re-enter (`components/IdleLock.tsx`).
- **PWA** — installable manifest + minimal service worker
  (`public/manifest.json`, `public/sw.js`).
- **Digest cron** — `app/api/cron/digest` computes the pending-reminder
  count and top-3 watchlist on the schedule in `vercel.json` (04:30 SAST /
  02:30 UTC). It currently logs rather than sending; email/push delivery is
  wired in Phase 1 once a provider is chosen.
- **Module pages** — Health, Notes & Lists, Calendar, Money, Vehicle &
  Travel, Home & Pets and Vault are routed and navigable but show a "coming
  in Phase N" placeholder until their own phase lands.

## Not yet built

- Every module's actual data model beyond the Phase 0 shared tables
  (fuel logs, budgets, medicine schedules, documents, etc. — see the build
  plan's phase table)
- Email/push delivery for the digest and reminders
- Google Calendar / Gmail / Drive integration
- Statement import, field-level encryption for Vault/Health sensitive
  fields, and the nightly Drive backup (all need their own OAuth/credential
  setup before they can be wired up)

## Local setup

```bash
npm install
cp .env.local.example .env.local
# paste the anon key and (for the digest route) the service_role key
npm run dev
```

Get both keys from Supabase dashboard → Project Settings → API, project
`eaxyxsrsljdonkravpoj`.

## Deploying

Connect this repo to a Vercel project and add the env vars from
`.env.local.example` (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`)
in the Vercel project settings, then set the same `CRON_SECRET` value on the
`/api/cron/digest` Cron Job.

## Database migrations

SQL migrations live in `supabase/migrations/` and have already been applied
to the `eaxyxsrsljdonkravpoj` project directly. Apply new ones with the
Supabase CLI or MCP tooling — this repo does not run migrations at deploy
time.
