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

`src/lib/mock-data.ts` defines the typed `ShoppingRepository` boundary and an in-memory demo implementation. The UI uses seeded mock data and client state; updates do not persist after a reload. Authentication is simulated. Supabase, FastAPI, API endpoints, and a physical database schema are not implemented or connected. Those integrations are deferred until API and schema contracts and project credentials are approved.

Product behavior and labels follow the approved BRD, Screen Specification, Component Specification, and PO navigation decisions. The approved MagicPath canvas informs the visual direction; where its older prototype behavior conflicts with current screen rules, the screen rules take precedence.
