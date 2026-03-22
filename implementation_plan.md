# Onboarding Flow: Role Selection → Profile Quiz → Match Display

When a new user signs up via Clerk, they should be guided through a 3-step onboarding wizard before accessing the main app. This plan integrates with the existing Vite + React + Clerk + Supabase + Tailwind v4 + motion stack.

## User Review Required

> [!IMPORTANT]
> **Questions for you before I proceed:**
>
> 1. **Quiz content** — What questions should the profile quiz ask? I'm proposing role-specific questions (see below), but do you have specific questions in mind?
>    - *Mentors*: Department, expertise tags, research interests, availability
>    - *Mentees*: Program (PhD / Masters / Undergrad), major, interests, availability
> 2. **Matching algorithm** — The existing `mentors` and `mentees` tables have `tags`/`interests` and `research_interests` columns. Should matching be purely tag-overlap based, or do you want more sophisticated weighting (e.g., availability overlap, department match)?
> 3. **After onboarding** — Should the user be auto-paired with their top match, or just shown matches and allowed to request a pairing manually?
> 4. **Profile editing** — Should users be able to re-take the quiz or edit their profile later from Settings?

---

## Proposed Changes

### Database Layer

#### [NEW] [003_user_profiles.sql](file:///c:/Users/alfri/Code-A-Thon/supabase/migrations/003_user_profiles.sql)

New `user_profiles` table to track onboarding state, separate from the existing `mentors`/`mentees` tables:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee')),
  onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

This table acts as the "source of truth" for whether a user has finished onboarding and what role they chose. The actual profile data lives in the existing `mentors` / `mentees` tables (populated during Step 2 of the quiz).

RLS policies will allow users to read/write only their own row.

#### [MODIFY] [database.types.ts](file:///c:/Users/alfri/Code-A-Thon/src/types/database.types.ts)

Add the `user_profiles` table type definition to the [Database](file:///c:/Users/alfri/Code-A-Thon/src/types/database.types.ts#9-131) interface.

#### [MODIFY] [types.ts](file:///c:/Users/alfri/Code-A-Thon/src/types.ts)

Add convenience exports: `UserProfileRow`.

---

### Onboarding Hook & Route Guard

#### [NEW] [useOnboardingStatus.ts](file:///c:/Users/alfri/Code-A-Thon/src/hooks/useOnboardingStatus.ts)

Custom hook that:
1. Uses `useUser()` from Clerk to get the current `clerk_user_id`
2. Queries `user_profiles` via the authenticated Supabase client
3. Returns `{ isLoading, isOnboarded, role }` — consumed by the guard and the onboarding pages

#### [NEW] [OnboardingGuard.tsx](file:///c:/Users/alfri/Code-A-Thon/src/components/OnboardingGuard.tsx)

A wrapper component used in [main.tsx](file:///c:/Users/alfri/Code-A-Thon/src/main.tsx):
- If `isOnboarded === true` → render children (normal app)
- If `isOnboarded === false` → `<Navigate to="/onboarding" />`
- If `isLoading` → show a skeleton/spinner

---

### Onboarding UI Pages (3-Step Wizard)

#### [NEW] [Onboarding.tsx](file:///c:/Users/alfri/Code-A-Thon/src/pages/Onboarding.tsx)

Container page that manages the 3-step flow with a progress bar using `motion` for step transitions. Holds state: `{ step, role, quizAnswers }`.

#### [NEW] [RoleSelection.tsx](file:///c:/Users/alfri/Code-A-Thon/src/pages/onboarding/RoleSelection.tsx)

**Step 1** — Two large animated cards ("Become a Mentor" / "Become a Mentee") with icons, descriptions, and hover effects. Uses the existing design system colors (`primary`, `primary-container`, `surface`). On selection, creates a `user_profiles` row and advances to Step 2.

#### [NEW] [ProfileQuiz.tsx](file:///c:/Users/alfri/Code-A-Thon/src/pages/onboarding/ProfileQuiz.tsx)

**Step 2** — Dynamic multi-field form based on the chosen role:

| Field | Mentor | Mentee |
|-------|--------|--------|
| Name | ✅ (pre-filled from Clerk) | ✅ (pre-filled from Clerk) |
| Email | ✅ (pre-filled from Clerk) | ✅ (pre-filled from Clerk) |
| Department / Major | ✅ dept | ✅ major |
| Program | — | ✅ (PhD / Masters / Undergrad) |
| Expertise tags / Interests | ✅ multi-select chips | ✅ multi-select chips |
| Research interests | ✅ multi-select chips | ✅ multi-select chips |
| Short bio | ✅ textarea | ✅ textarea |
| Availability | ✅ day/time picker | ✅ day/time picker |

On submit, inserts a row into `mentors` or `mentees` (with `clerk_user_id` set) and updates `user_profiles.onboarding_complete = true`.

#### [NEW] [MatchResults.tsx](file:///c:/Users/alfri/Code-A-Thon/src/pages/onboarding/MatchResults.tsx)

**Step 3** — Fetches all members of the *opposite* role and runs the matching algorithm client-side. Displays top 5 matches as cards with:
- Match score (percentage)
- Shared interests/tags highlighted
- "View Profile" button
- "Go to Dashboard" CTA

Uses `motion` for staggered card entrance animations.

---

### Matching Service

#### [NEW] [matchingService.ts](file:///c:/Users/alfri/Code-A-Thon/src/services/matchingService.ts)

Pure function: `calculateMatches(userProfile, candidates[]) → ScoredMatch[]`

Scoring algorithm (tag overlap + research interest overlap):
```
score = (sharedTags / totalUniqueTags) * 50 + (sharedResearchInterests / totalUniqueResearchInterests) * 50
```

Returns sorted array of `{ candidateId, name, avatar, score, sharedTags, sharedInterests }`.

---

### Routing Integration

#### [MODIFY] [main.tsx](file:///c:/Users/alfri/Code-A-Thon/src/main.tsx)

- Add `/onboarding` route (protected by `SignedIn` but **outside** the `OnboardingGuard`)
- Wrap the existing `<App />` layout route with `<OnboardingGuard>`

```diff
 <Routes>
   <Route path="/sign-in/*" element={<SignInPage />} />
   <Route path="/sign-up/*" element={<SignUpPage />} />
+
+  {/* Onboarding — signed-in but not yet onboarded */}
+  <Route path="/onboarding" element={
+    <SignedIn><Onboarding /></SignedIn>
+  } />

   {/* Protected + onboarded app routes */}
   <Route element={
     <>
       <SignedIn>
+        <OnboardingGuard>
           <App />
+        </OnboardingGuard>
       </SignedIn>
       <SignedOut><RedirectToSignIn /></SignedOut>
     </>
   }>
```

---

## Verification Plan

### Automated Tests
- Run `npm run build` (which runs `vite build` with TypeScript checking) to verify no type errors across all new and modified files.
- Run `npx tsc --noEmit` for explicit type-check.

### Manual / Browser Verification
1. **Fresh sign-up flow**: Create a new Clerk account → verify redirect to `/onboarding` → select role → fill quiz → see matches → land on dashboard.
2. **Returning user**: Sign out and back in with the same account → verify they skip onboarding and go straight to dashboard.
3. **Existing seed users**: Verify existing mentor/mentee seed data users are not affected (they don't have `user_profiles` rows, so they'd be prompted to onboard on first sign-in — we can discuss whether to auto-mark them as onboarded).
4. **Match quality**: After completing onboarding as a mentee with "Quantum Mechanics" interest, verify Dr. Julian Sterling appears as a top match.

> [!NOTE]
> There are no existing automated tests in this project. Verification will rely on `tsc --noEmit`, `vite build`, and manual browser testing.
