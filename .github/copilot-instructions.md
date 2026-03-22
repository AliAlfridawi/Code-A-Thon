# Project Guidelines

## Build and Validate
- Install dependencies: `npm install`
- Start dev server: `npm run dev` (configured for port `3000`)
- Type-check: `npm run lint` (`tsc --noEmit`)
- Production build: `npm run build`
- Preview build: `npm run preview`
- Clean build output: `npm run clean`
- There is no dedicated automated test suite yet. Treat `npm run lint` and `npm run build` as required validation steps after changes.

## Architecture
- Frontend stack: React + Vite + strict TypeScript.
- Keep presentational UI in `src/components/` and route-level views in `src/pages/`.
- Put data fetching and subscription logic in `src/hooks/` (not inline in page/component files).
- Keep business/domain logic in `src/services/`.
- Keep route path construction centralized in `src/constants/routes.ts`.

## Data and Security
- For authenticated database work, use the Supabase client from `src/hooks/useSupabase.ts` so Clerk tokens are injected correctly.
- Supabase Row Level Security depends on Clerk identity (`auth.jwt()->>'sub'`). Preserve this identity model in migrations and SQL functions.
- Messaging and conversation membership should use stable `clerk_user_id` identity keys.

## Database Changes
- Add schema updates as sequential files in `supabase/migrations/` (do not edit old migrations unless explicitly required).
- Keep SQL migration behavior backward compatible for existing data whenever possible.
- After schema changes, update generated DB types in `src/types/database.types.ts`.

## UI Conventions
- Use Tailwind CSS v4 utility classes and the design tokens defined in `src/index.css`.
- Use `lucide-react` for icons.
- Use the `motion` package for transitions/animation patterns already used in the app.

## Docs and References
- Start with `README.md` for setup and operational overview.
- Use `GEMINI.md` as the detailed developer guide for conventions and architecture rationale.
- Use `implementation_plan.md` for onboarding-flow context and planned behavior.
- Follow the link-first principle: reference existing docs rather than duplicating long guidance in code comments or new instruction files.
