# Vorexa Core

A private, single-owner personal operating system — Today, Plan, Wellness,
Money, Goals, Life (Home/Pets/Vehicle/Travel), Notes & Lists and Vault —
built on Next.js (App Router) + TypeScript + Supabase, deployed on Vercel.
It is deliberately separate from any multi-tenant platform: its own
Supabase project, its own login, its own Google connection. It shares its
visual identity, component language and legal/footer structure with the
wider Vorexa product family (see the Vorexa Master Brand Identity & Product
System spec) but is otherwise fully independent.

## v2.0 "Daily OS" — Phase 1

Per the Vorexa Core v2.0 Personal Operating System Upgrade Build Scope,
Phase 1 (Daily OS) is built: a rebuilt Today command centre, a real Plan
module (rich tasks with subtasks/priority/status/due dates/time-blocking/
focus timer), Universal Quick Capture (natural-language, AI-assisted when
`ANTHROPIC_API_KEY` is set, rule-based fallback otherwise), a Personal
Inbox, Morning Review / Evening Shutdown guided flows, cross-module search
(⌘K), and the new navigation IA (desktop sidebar + mobile bottom nav/More
sheet). Goals, Life, Home, Travel and Insights are routed with "coming in
Phase N" placeholders — their full data models are Phase 3-5 work, not yet
built. See `supabase/migrations/0020_plan_v2.sql` for the schema behind it.

**⚠ That migration has not been applied to the live database.** This
session's Supabase MCP connection doesn't have access to project
`eaxyxsrsljdonkravpoj` (the one this app actually uses — see below), so it
could only be written to the repo, not run. Apply it via the Supabase CLI
or SQL editor before deploying this branch, or the new Plan/Today code will
error against the old `tasks` schema.

## v2.0 "Financial Core" — Phase 2

Phase 2 extends the existing Money module (which already had accounts,
transactions, category budgets and debt tracking) rather than replacing it:
a Money Command Centre dashboard (cash/income/expenses/remaining
budget/debt/savings/net worth/cash flow), category management (rename/
hide/reorder + Flexible Budget grouping), a Needs-Review queue with
merchant→category memory, CSV import v2 (column mapping, duplicate
detection, reusable per-bank templates), a Recurring Expenses/Subscriptions
register with review flagging, a Debt Payoff Simulator (snowball/avalanche/
custom strategies with scenario comparison), Savings Goals, and a Net Worth
tracker with monthly snapshots. Recurring expenses and debts due soon feed
the Today watchlist and Money Today card. See
`supabase/migrations/0021_money_v2.sql` — **also not yet applied to the
live database**, same caveat as 0020 above.

Expense Analytics is intentionally kept lean (top merchants + largest
expenses on the Overview tab) rather than a separate page — a full
dedicated analytics view is Phase 5 (Insights) work. Financial Import is
Phase 1 only (CSV/manual mapping) — email statement extraction and
consent-based bank integration are Phase 2/3 of that specific spec section
and were not attempted (no online banking credentials are ever requested
or stored, per the spec).

## v2.0 "Wellness" — Phase 3

Extends the existing Health module (Medicines, Appointments, weight — kept
as-is) into a full Wellness hub: a Habit Management system (frequency
options including weekdays/x-per-week/custom, streaks, completion rate,
pause/archive), a Daily Check-in (mood/energy/stress/sleep quality, all
optional per the spec), Sleep tracking (bedtime/wake/quality, average
duration, bedtime consistency), BMI (only shown when a height is on file —
never estimated), and a Wellness dashboard tab pulling all of it together
alongside doses-due and upcoming appointments. Habit completion now feeds
the Today Wellness card, and Quick Capture gained a Mood type. See
`supabase/migrations/0022_wellness_v2.sql` — **also not yet applied to the
live database**, same caveat as 0020/0021 above.

## Current state

- **Database** — Supabase project `eaxyxsrsljdonkravpoj`, schema `public`.
  Shared tables every module builds on: `profiles`, `entities`, `tags`,
  `reminders` (drives the Today watchlist, calendar auto-events and the
  04:30 digest), `attachments`, `audit_log` (currently written to by the
  Vault module), `events`, `quick_captures` (the generic capture inbox that
  module pages claim rows out of), `tasks` (extended in 0020 with
  priority/status/subtasks/scheduling — see above), `task_focus_sessions`,
  `daily_reviews`, plus each module's own tables (see
  `supabase/migrations/`). Every table is row-level-secured to `owner_id =
  auth.uid()`.
- **Auth** — Supabase email/password. There is **no public sign-up**:
  account creation via the client-side signUp API is blocked at the
  database level (`supabase/migrations/0002_lock_down_signup_trigger.sql`,
  `0010_lock_down_signup_trigger_public.sql`), and accounts are created by
  an admin account through **Settings → Developer → Add a user**, which
  calls the Supabase service-role admin API
  (`app/(app)/developer/actions.ts`). MFA is not currently implemented —
  don't describe the platform as MFA-protected until that lands.
- **App shell** — sidebar (desktop) / bottom bar + quick-capture sheet
  (mobile) navigation across all eight areas, a privacy-blur toggle that
  hides every `data-sensitive` value in one tap, a dark/light theme toggle
  persisted to `profiles`, and a quick-capture sheet (fuel / expense /
  weight / note / shopping item) that queues to `localStorage` when offline
  and flushes on reconnect.
- **Idle lock** — `/health` and `/vault` re-lock after 15 minutes idle and
  require the account password to re-enter (`components/IdleLock.tsx`).
- **PWA** — installable manifest + minimal service worker
  (`public/manifest.json`, `public/sw.js`).
- **Digest cron** — `app/api/cron/digest` computes the pending-reminder
  count and top-3 watchlist on the schedule in `vercel.json` (04:30 SAST /
  02:30 UTC). It currently logs rather than sending; email/push delivery is
  a future phase once a provider is chosen.
- **Modules** — Today, Health, Notes & Lists, Calendar (with one-way Google
  Calendar sync), Money, Vehicle & Travel, Home & Pets and Vault are all
  live with their own data models — see `supabase/migrations/` for the
  full schema history.
- **Brand** — public marketing/auth surfaces (landing, login, `/privacy`,
  `/terms`, `/security`, `/popia`, `/contact`) use the Vorexa Core teal/mint
  identity on a Deep Navy canvas; the in-app shell shares the same design
  tokens (`app/globals.css`) with Core teal as the single restrained accent
  colour, replacing the earlier per-module rainbow navigation colours.

## Not yet built

- Email/push delivery for the digest and reminders
- MFA
- A verified, published PAIA manual and Information Officer registration
  (see `/popia` — intentionally left as "in progress" rather than invented)
- Sanitised/fixture-based marketing screenshots on the landing page (the
  landing page currently describes capabilities in text only, on purpose —
  see the Vorexa Core Platform Update Specification's privacy rule against
  building screenshots from live owner data)
- Field-level encryption for Vault/Health sensitive fields, and the nightly
  Drive backup (needs its own OAuth/credential setup before it can be
  wired up)

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
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`,
plus `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` for Calendar sync) in the
Vercel project settings, then set the same `CRON_SECRET` value on the
`/api/cron/digest` Cron Job. Optionally add `ANTHROPIC_API_KEY` to turn on
AI-assisted natural-language parsing in Quick Capture
(`lib/captureParserAI.ts`) — without it, Quick Capture still works, using
the rule-based parser in `lib/captureParser.ts`.

## Database migrations

SQL migrations live in `supabase/migrations/` and have already been applied
to the `eaxyxsrsljdonkravpoj` project directly. Apply new ones with the
Supabase CLI or MCP tooling — this repo does not run migrations at deploy
time.
