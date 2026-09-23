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

## v2.0 "Life Management" — Phase 4

Adds Goals as a first-class module (purpose, target, deadline, next action,
milestones, and links to Money savings goals plus any task/habit that
carries a `goal_id`), a new Life Admin register (passports, licences,
insurance, warranties, memberships, contracts, subscriptions, tax, policy
reviews, anniversaries and documents, each with configurable lead-day
alerts — urgency is computed live from `due_date` + `lead_days` rather than
a stored status, the same approach as the existing watchlist), a real Home
module (maintenance register, emergency/service contacts, and a read-only
bills summary that reuses Money's `recurring_expenses` rather than
duplicating it — full management stays in Money), and a real Travel module
(trips with bookings/itinerary/checklist/document/expense items). Notes
gained tags, a favourite/star, and five new categories (checklist, journal,
reference, decision, travel note — Personal Journal reuses the notes table
with `category='journal'` rather than a parallel table); Vault documents
gained a broad `category` alongside the existing specific `doc_type`, with
a filter row in the Documents tab. Life Admin action items and upcoming
trips now feed the Today watchlist, and Goals/Life Admin/Travel/Home
contacts are searchable from the universal search (⌘K). See
`supabase/migrations/0023_life_management_v2.sql` — **also not yet applied
to the live database**, same caveat as 0020/0021/0022 above.

Scope cuts made deliberately rather than left half-built: Home's bills
section is read-only (manage in Money); household assets stay on the
existing Pets/Home & Pets page rather than a duplicate Assets tab, since
they're the same underlying `assets` table.

## v2.0 "Intelligence" — Phase 5

Adds a real Insights module (replacing the placeholder): short, factual,
computed-live observations across Money (spend pace vs last month, budget
over-runs, projected month-end spend vs plan, a cash-flow runway warning
against committed bills and debt minimums, top merchant, net worth change,
debt-free date at current minimum payments), Time (task completion rate,
overdue count), Habits (30-day completion rate, current/best streaks) and
Vehicle (cost per km). Deliberately no generic motivational copy — every
line names a real number pulled from the owner's own records, the same
computed-not-stored approach as `lib/watchlist.ts`. Adds guided **Weekly
Review** and **Monthly Review** flows (`/insights/weekly-review`,
`/insights/monthly-review`) that open with the week's/month's actual
numbers before asking for reflection notes and a rating, saved to the new
`weekly_reviews`/`monthly_reviews` tables. Adds a **Core Assistant**
(`/assistant`) — ask a natural-language question about your own data (spend,
tasks, habits, goals, upcoming bills); a server action assembles a compact,
bounded JSON snapshot of the owner's own records and calls the Claude API
with an explicit instruction to answer only from that context and say so
plainly when something isn't on file, never to invent numbers. Requires
`ANTHROPIC_API_KEY` (same env var Quick Capture uses) — without it the page
says so rather than pretending to work. Answers are logged to
`assistant_queries` for the owner's own history. See
`supabase/migrations/0024_intelligence_v2.sql` — **also not yet applied to
the live database**, same caveat as 0020–0023 above.

## v2.0 "Professionalisation" — Phase 6 (partial)

This phase is about hardening rather than new features, and most of its
items (a real backup strategy, error monitoring, field-level encryption)
need external credentials or a live/connected environment this sandboxed
session doesn't have — see "Not yet built" below for what's still
genuinely outstanding. What was actually completable this session:

- **Fixed a filter-injection bug** in universal search: two queries built
  their PostgREST `.or()` filter by interpolating the raw search string
  directly into it, so a query containing a comma or parenthesis could
  rewrite the filter's own logic (RLS still limited it to the owner's own
  rows, so this was never a cross-account leak, but it could still break
  or misdirect a search). Replaced both with two plain `ilike()` queries
  merged in code, the same fix pattern used for the rest of the app's
  search calls. Reviewed the rest of the codebase for `dangerouslySetInnerHTML`,
  `.rpc()` and similar interpolation-into-query patterns — none found.
- **Data export** (`Settings → Your data → Export my data`) — the
  completable slice of the spec's broader import/export item. Bundles
  every one of the owner's own records, across every module, into one
  downloadable JSON file. Deliberately excludes `google_accounts` (holds
  live OAuth tokens) and the internal `audit_log`.
- **Accessibility pass** on every icon-only button added in Phases 4–5
  (close/delete/toggle/add controls that had no visible text) — added
  `aria-label`s so screen readers announce what each one does.
- **PWA review** — confirmed the existing service worker and manifest need
  no changes: the service worker is a deliberate route-agnostic
  passthrough (no per-page cache list to maintain) and `start_url: "/today"`
  is still correct, so every module added across Phases 1–5 is already
  covered without modification.

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
- **Modules** — Today, Plan, Wellness, Notes & Lists, Calendar (with one-way
  Google Calendar sync), Money, Goals, Life Admin, Home, Vehicle, Travel,
  Home & Pets, Vault, Insights and the Core Assistant are all live with
  their own data models — see `supabase/migrations/` for the full schema
  history.
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
- Error monitoring (Sentry or similar — needs its own account/DSN)
- A first-login onboarding flow
- A full accessibility audit (automated, e.g. axe/Lighthouse, plus a manual
  screen-reader pass) and a full security audit (dependency scanning,
  pen-test-style review) — this session's Phase 6 work fixed one real
  issue it found (search filter injection) and did a manual pass over the
  Phase 4/5 UI, but that is a spot-check, not an audit
- Broader CSV/JSON import beyond Money's bank-statement importer (the new
  Settings → Export covers read-only export of every module; import
  remains Money-only)

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

**`0020_plan_v2.sql` through `0024_intelligence_v2.sql` (Phases 1–5) have
not yet been applied** — this session's Supabase MCP access doesn't reach
the live project. Apply them in order before the corresponding modules
(Plan, Money v2, Wellness, Goals/Life Admin/Home/Travel, Insights/Reviews/
Assistant) will work against real data; `lib/supabase/database.types.ts`
has already been hand-updated to match.
