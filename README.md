# Worlebury Business Management App

A multi-tenant business management platform for the Worlebury group: CRM/pipeline, finance, reporting dashboards, and staff resource management — with admin-controlled access per company ("entity") and per tool.

Built with Next.js 14 (App Router, TypeScript, Tailwind) and Supabase (Postgres, Auth, Storage, Row Level Security).

## How multi-tenancy works

- **Entities** = companies (Worlebury today, more group companies later). Every table of business data (`crm_*`, `finance_*`, `resources`) is scoped by `entity_id`.
- **Super admins** (a small group — you, essentially) can create new entities. See `supabase/migrations/0001_core.sql`.
- **Entity roles**: `owner` / `admin` (full access to everything in that entity), `manager` / `member` / `read_only` (access controlled per-tool via the Permissions screen).
- **Tools**: `crm`, `finance`, `reporting`, `resources`, `admin`. Each non-admin user gets explicit `view` / `edit` / `delete` / `manage` flags per tool, per entity — set under **Admin → Permissions**.
- **Row Level Security (RLS)** enforces all of this at the database level (`supabase/migrations/0005_rls.sql`), not just in the UI — so even a bug in a page can't leak another entity's data.
- **No public sign-up.** Accounts are created only by an entity admin inviting someone by email (**Admin → Users**), who then sets their password via the invite link.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's URL + anon key
npm run dev
```

Open http://localhost:3000. You'll be redirected to `/login`. To get in the first time, see "Bootstrapping your first account" below.

### Database

Migrations live in `supabase/migrations/`, applied in filename order. Either:

- **Supabase CLI** (recommended): `supabase link --project-ref <ref>` then `supabase db push`, or
- **Supabase Studio**: paste each `.sql` file into the SQL Editor and run in order (0001 → 0006).

### Bootstrapping your first account

1. Sign up isn't public — instead, create your first user directly in Supabase Studio (**Authentication → Users → Add user**), or run `supabase.auth.admin.createUser()` once via the SQL/JS console.
2. Promote yourself to super admin and create the Worlebury entity — the exact SQL is in `supabase/seed.sql`.
3. Log in — you'll land on the dashboard with full access.
4. From then on, invite everyone else from **Admin → Users** inside the app.

## Project structure

```
src/app/(auth)/          Login + set-password (invite) pages
src/app/(app)/            Everything behind auth: dashboard, crm, finance, resources, admin
src/components/           UI primitives, layout (sidebar/topbar), module-specific components
src/lib/supabase/         Browser client, server client, admin client, middleware
src/lib/permissions.ts    Server-side helper resolving what the current user can do
supabase/migrations/      Full schema + RLS, applied in order
```

## Theming

Follows the Worlebury Brand Guidelines (v1.0): Charcoal `#1E2124` and Off-white `#F7F5F1` carry the UI, Bronze `#B8863B` is a restrained accent reserved for primary actions and active states (never a dominant fill, per the guidelines). Headings and the wordmark use Spectral (serif); UI, labels and body copy use Archivo — both loaded via `next/font/google` in `src/app/fonts.ts`.

All colours live as CSS variables in `src/app/globals.css` (`--brand-*`, `--accent*`), wired into Tailwind via `tailwind.config.ts`. Every component reads `bg-accent`, `text-ink`, etc. rather than hardcoded hex values, so any future refresh of the guidelines is a one-file change. The app icon/logo is at `public/logo.png` (in-app use) and `src/app/icon.png` / `apple-icon.png` (favicon, auto-wired by Next.js's file convention).

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full, step-by-step guide to deploying on your Linode box with a Worlebury subdomain, plus how to get automatic deploys on every `git push`.

## What's scaffolded vs. what's a starting point

Fully wired to Supabase: auth, entity switching, admin (entities/users/permissions), CRM contacts + CSV import + pipeline board, finance invoices + expenses, four dashboard pages, resource upload/download/assignment.

Deliberately left as extension points, since every business does these differently: invoice PDF generation/emailing, recurring invoices, deal-stage automation rules, notifications. `FEATURE_RECOMMENDATIONS.md` covers these and other growth features to prioritise next.
