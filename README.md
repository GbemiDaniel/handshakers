# Handshakers

Handshakers is a real-time, team-wide time tracking and payout calculation platform built with Next.js and Supabase. It solves the chaos of multi-user time logging by introducing live presence, strict timeline tracking, and collision prevention.

## Features

- **Live Presence & Collision Warning:** Powered by Supabase Realtime Presence. You can instantly see who is currently typing or logging time to avoid overlapping entries.
- **Strict Timeline Validation:** Validates new entries against the global timeline. Time travel and pool cap limits (up to 80 hours) are strictly enforced.
- **Real-time Synchronization (SWR):** Implements `useSWR` with active background polling (`refreshWhenHidden: true`, `dedupingInterval: 0`) ensuring all clients stay perfectly in sync without manual refreshes.
- **Precision Payout Calculator:** Computes exact prorated decimal hours (rounded perfectly to 3 decimal places) across the entire team based on the client's approved platform pool.
- **Detailed Clipboard Exports:** Instantly copies strict, perfectly aligned daily breakdowns and total payouts to your clipboard for invoicing and sharing. 
- **Undo Last Entry:** Anyone can undo their own entry while it's still the latest in the workspace. Workspace admins can override that, after a confirmation that names whose entry is affected.
- **Global Sonner Toasts:** Clean, non-intrusive global toast notifications replace native browser alerts and inline UI errors for a superior user experience.

## Tech Stack

- **Framework:** Next.js 16 (App Router) / React 19
- **Backend & Database:** Supabase (PostgreSQL, Realtime, Presence)
- **Styling:** Tailwind CSS
- **Data Fetching:** SWR
- **UI Components & Icons:** Lucide-React, Sonner (for Toasts)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database

The schema lives in `supabase/migrations/`, and those files are the only source of truth. Running them in order against a fresh Supabase project reproduces the production database: tables, RLS policies, functions, grants and realtime. `20260923000000_baseline.sql` is the starting point and documents why each security rule exists.

**Every schema change is a new migration file.** Don't create tables, policies or functions from the Supabase dashboard. A dashboard change doesn't exist in the repo, which is how the old `schema.sql` drifted away from production.

The [Supabase CLI](https://supabase.com/docs/guides/cli) is a pinned dev dependency, so `npm install` provides it. One-time setup per machine:

```bash
npx supabase login
npx supabase link --project-ref hxaqeerbawxuqvmtcwmv
npx supabase migration list   # every version should appear under both Local and Remote
```

Making a change:

```bash
npx supabase migration new describe_the_change   # write SQL in the new file
npx supabase db push                              # apply it to the linked project
npx supabase gen types typescript --linked > supabase/types.ts
```

Access rules in brief:

- **Super admin** (`profiles.is_super_admin`): full access to every workspace.
- **Workspace lead** (`account_members.role = 'admin'`): admin powers inside their own workspace only (capacity, members, editing and undoing logs).
- **Member**: reads and logs their own time within their own workspaces, and can undo their own entry while it's still the latest.

Anything the UI hides must also be enforced by a policy, because the browser can query Supabase directly.

## Commands

- `npm run dev`: Starts the local development server.
- `npm run lint`: Runs ESLint for code quality checks.
