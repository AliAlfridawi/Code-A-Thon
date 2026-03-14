# Maventor Multiphase Implementation Plan

## Objective
Deliver a demo-ready Maventor MVP by March 23 using Next.js + Supabase for a single-club mentorship program with no-auth demo mode.

## Scope
- In scope: mentee, mentor, officer workflows; manual pairing; direct messaging; goals; check-ins; survey capture; compatibility score; analytics dashboard.
- Out of scope: production auth, multi-club tenancy, native mobile apps, file attachments.

## Phase 0: Setup and Controls
Purpose: establish predictable execution environment and ownership.

Agent actions:
1. Create project board checklist from this plan and assign owners for frontend, backend, and QA.
2. Confirm branch strategy: main plus short-lived feature branches.
3. Create issue templates for feature, bug, and task.
4. Add Definition of Done checklist for every merge.

Deliverables:
- Tracking board with phase-mapped tasks.
- Team working agreement and merge checklist.

Acceptance gate:
- All contributors can identify their first assigned task and delivery timeline.

## Phase 1: App Bootstrap (Next.js)
Purpose: create runnable application shell and route scaffolding.

Agent actions:
1. Scaffold Next.js app with TypeScript, App Router, ESLint, and Tailwind in a web folder.
2. Add baseline folder structure for app routes, components, lib, and services.
3. Build shared layout shell with navigation for Mentee, Mentor, and Officer views.
4. Add placeholder routes:
- /dashboard/mentee
- /dashboard/mentor
- /dashboard/officer
- /pairings
- /messages
- /goals
- /check-ins

Deliverables:
- Running app with navigable placeholder pages.

Acceptance gate:
- npm run dev works and all listed routes render without runtime error.

## Phase 2: Supabase Foundation
Purpose: establish database schema and data access patterns.

Agent actions:
1. Initialize Supabase project and connect app through env vars.
2. Create SQL migrations for:
- users
- clubs
- mentee_profiles
- mentor_profiles
- officer_profiles
- pairings
- goals
- check_ins
- messages
- survey_responses
- compatibility_scores
- analytics_snapshots
3. Add indexes and constraints for user_id, pairing_id, club_id, created_at.
4. Add typed query/repository layer in code for reusable reads/writes.

Deliverables:
- Migration scripts and typed data access helpers.

Acceptance gate:
- Migrations run cleanly and basic read/write smoke tests pass.

## Phase 3: Seed Data and Demo Mode
Purpose: enable fast no-auth demo walkthrough.

Agent actions:
1. Build seed script with under-50 realistic users and active pairings.
2. Add role switcher (Mentee, Mentor, Officer) for no-auth demo mode.
3. Add demo persona selector with preloaded contexts.
4. Ensure each role lands on a meaningful dashboard state.

Deliverables:
- Seed command and role switch demo entry flow.

Acceptance gate:
- Demo can start without account creation and show populated screens for each role.

## Phase 4: Profile Onboarding
Purpose: collect role-specific mentorship context.

Agent actions:
1. Build mentee profile form (major, goals, interests, graduation year).
2. Build mentor profile form (expertise, availability, mentoring style).
3. Build officer context section (club metadata and oversight view).
4. Add save, edit, validation, and success/error states.

Deliverables:
- Functional onboarding forms for all roles.

Acceptance gate:
- Create and edit persist correctly to Supabase for all roles.

## Phase 5: Manual Pairing Workflow (Officer)
Purpose: implement controlled matching and lifecycle management.

Agent actions:
1. Build officer pairing workspace with searchable mentor and mentee lists.
2. Implement create pairing flow with match reason.
3. Add lifecycle controls: active, paused, completed.
4. Add pairing details view with current goals, check-ins, and message activity summary.

Deliverables:
- Officer can create and manage pairings end-to-end.

Acceptance gate:
- Pairing creation and status transitions persist and reflect in dashboards.

## Phase 6: Messaging
Purpose: support mentor-mentee communication.

Agent actions:
1. Build pair-scoped thread UI.
2. Implement message send/read with timestamp ordering.
3. Add latest-message summaries in role dashboards.
4. Restrict visibility to related pairing participants and officer oversight views.

Deliverables:
- Stable direct messaging workflow.

Acceptance gate:
- Mentor and mentee can exchange messages; officer can view activity summary.

## Phase 7: Goals, Check-Ins, and Surveys
Purpose: track mentorship progress and outcomes.

Agent actions:
1. Build goal CRUD with status and target date.
2. Build check-in submission flow with separate mentee and mentor inputs.
3. Add pulse survey capture after check-in.
4. Surface completion and recency indicators on dashboards.

Deliverables:
- End-to-end progress management features.

Acceptance gate:
- A full cycle (goal update -> check-in -> survey) stores and displays correctly.

## Phase 8: Compatibility Scoring
Purpose: add innovation and explainable matching intelligence.

Agent actions:
1. Implement deterministic scoring using weighted factors:
- skill match
- goal alignment
- availability overlap
2. Store score, confidence, and factor breakdown.
3. Show score hints in officer pairing workflow.
4. Recompute score when profile or pairing context changes.

Deliverables:
- Explainable compatibility scoring pipeline.

Acceptance gate:
- Score changes when input factors change and remains interpretable.

## Phase 9: Analytics Dashboard
Purpose: provide club-level insight for officer decisions.

Agent actions:
1. Implement KPI queries/cards for:
- meetings_count
- avg_satisfaction
- avg_compatibility
2. Add trend snapshot section and recent activity feed.
3. Update analytics snapshots after check-ins and surveys.
4. Validate KPI math against seeded records.

Deliverables:
- Officer analytics dashboard tied to live data.

Acceptance gate:
- KPI values update correctly after new events and pass manual spot checks.

## Phase 10: UX Polish and Reliability
Purpose: improve demo quality and reduce failure risk.

Agent actions:
1. Apply styles from docs/styleGuide.html consistently.
2. Add complete empty, loading, and error states for every critical route.
3. Improve mobile responsiveness for dashboard and forms.
4. Add keyboard-visible focus and contrast checks.

Deliverables:
- Polished, resilient UX across primary journeys.

Acceptance gate:
- Demo journey runs smoothly on desktop and mobile viewport sizes.

## Phase 11: QA and Demo Script
Purpose: verify behavior and lock presentation flow.

Agent actions:
1. Run role-based smoke tests:
- mentee: profile -> goals -> check-in
- mentor: profile -> messages -> feedback
- officer: pairing -> monitor -> analytics
2. Add regression checklist for messaging, pair status, and KPI updates.
3. Create 3-5 minute demo script with exact click path.
4. Time-box dry runs and fix blockers immediately.

Deliverables:
- Test checklist and final demo runbook.

Acceptance gate:
- Two complete dry runs execute without blockers.

## Phase 12: Documentation and Submission Pack
Purpose: finalize handoff and judging assets.

Agent actions:
1. Update root README with setup, env vars, migration, seed, and demo steps.
2. Link architecture diagrams from docs/diagrams.
3. Ensure naming consistency between code, diagrams, and UI labels.
4. Prepare final submission checklist and evidence notes.

Deliverables:
- Finalized documentation and submission-ready package.

Acceptance gate:
- New teammate can run the app and complete demo path using docs alone.

## Parallelization Strategy
- Parallel group A: Phase 4 (Profiles) and Phase 6 (Messaging) after Phase 2 is complete.
- Parallel group B: Phase 7 (Goals/Check-ins) and Phase 8 (Scoring) after Phase 5 baseline is complete.
- Sequential blockers: Phase 2 before all data features, Phase 3 before demo rehearsals, Phase 11 before submission.

## Risk Register and Mitigations
1. Risk: Scope creep beyond March 23.
Mitigation: enforce out-of-scope list and phase gates.
2. Risk: Data model churn mid-build.
Mitigation: schema freeze after Phase 2 and patch via migrations only.
3. Risk: Demo failures due to empty states.
Mitigation: Phase 3 seeded personas plus Phase 10 state coverage.
4. Risk: Analytics mismatch.
Mitigation: manual KPI spot checks every time aggregation logic changes.

## Definition of Done (MVP)
- All three roles complete core journey without dead ends.
- Manual pairing and messaging are stable.
- Goals, check-ins, surveys, scoring, and analytics are connected.
- Demo mode works without login.
- Documentation and diagrams match actual implementation.
