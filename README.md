# Handshakers

Handshakers is a real-time, team-wide time tracking and payout calculation platform built with Next.js and Supabase. It solves the chaos of multi-user time logging by introducing live presence, strict timeline tracking, and collision prevention.

## Features

- **Live Presence & Collision Warning:** Powered by Supabase Realtime Presence. You can instantly see who is currently typing or logging time to avoid overlapping entries.
- **Strict Timeline Validation:** Validates new entries against the global timeline. Time travel and pool cap limits (up to 80 hours) are strictly enforced.
- **Real-time Synchronization (SWR):** Implements `useSWR` with active background polling (`refreshWhenHidden: true`, `dedupingInterval: 0`) ensuring all clients stay perfectly in sync without manual refreshes.
- **Precision Payout Calculator:** Computes exact prorated decimal hours (rounded perfectly to 3 decimal places) across the entire team based on the client's approved platform pool.
- **Detailed Clipboard Exports:** Instantly copies strict, perfectly aligned daily breakdowns and total payouts to your clipboard for invoicing and sharing. 
- **Admin Rollbacks:** Allows authorized administrators to seamlessly roll back mistaken final entries on the global timeline.
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

## Configuration

Make sure your Supabase instance is properly configured with the following tables:
- `time_logs`
- `profiles`
- `team_settings`
- Enable Supabase Realtime on the `time_logs` table.

## Commands

- `npm run dev`: Starts the local development server.
- `npm run lint`: Runs ESLint for code quality checks.
