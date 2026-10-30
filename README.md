# Shopping-Auren

Responsive frontend prototype for the approved Shopping-Auren MVP screen and component specifications.

## Run locally

```sh
pnpm install
pnpm dev
```

The optimized frontend build is `pnpm build`.

## Technical baseline

- Next.js 16.4.3 with the App Router
- React and React DOM 19.3.1
- TypeScript 5.9.3
- Lucide React 1.65.0 for interface icons
- Manrope UI type with Lora heading accent; Warm Natural + Editorial Modern palette

## Data and authentication

`src/lib/shopping-types.ts` defines the app data types. Supabase Auth and the Supabase browser Data API now back the library, Weekly Plan, active Checklist, and shopping history. The frontend talks directly to Supabase for the MVP; a separate Render backend is deferred.

Product behavior and labels follow the approved BRD, Screen Specification, Component Specification, and PO navigation decisions. The approved MagicPath canvas informs the visual direction; where its older prototype behavior conflicts with current screen rules, the screen rules take precedence.
# Supabase dev setup

The MVP uses one Supabase dev project. The browser connects directly with Supabase Auth and the Data API; do not put a service-role key in the frontend.

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project's publishable key.
2. Run `pnpm install`, then `pnpm dev`.
3. Create an account or sign in through the app. With email confirmation enabled, confirm the address before signing in.

The schema migrations are in `supabase/migrations/`. They store the library and Weekly Plan in relational tables, persist the active Checklist and shopping history, enable owner-only RLS for all application tables, and use invoker-rights Postgres functions for atomic multi-table saves.

The old in-memory demo seed is not imported automatically. It contains duplicate Meal names; the Supabase schema enforces per-user unique names after trimming and whitespace normalization. Add only data you want to keep to your account.
