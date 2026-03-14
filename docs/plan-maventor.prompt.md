## Plan: Maventor MVP for Code-A-Thon

Build a web-first MVP focused on structured mentor-mentee coordination for one club, with demo-ready workflows by March 23. The fastest path is a no-auth demo environment, admin-led matching, direct messaging, goals/check-ins, and an analytics dashboard centered on meeting activity, survey outcomes, and compatibility indicators.

**Steps**
1. Phase 1: Product blueprint and demo narrative. Define user journeys for mentee, mentor, and club officer; lock core stories for onboarding, pairing, communication, and progress tracking; define what is intentionally out of MVP. This phase blocks all build work.
2. Phase 2: Information architecture and data model. Specify entities and relationships for users, mentor/mentee profiles, pairings, goals, check-ins, messages, meetings, surveys, and compatibility scores. Add status/state rules and minimal required fields. Depends on step 1.
3. Phase 3: UX flows and screen map. Design the page/screen inventory for officer dashboard, profile setup, pairing management, chat, goal tracker, check-in forms, and analytics views. Define key interactions and empty states for under-50 pilot usage. Depends on step 2.
4. Phase 4: Application scaffold and baseline UI. Set up the web app project, routing, shared layout, and design tokens/components for a polished demo-ready experience. Parallel with step 5 after IA is stable.
5. Phase 5: Core feature implementation. Implement onboarding profiles, manual admin matching workflow, direct messaging, goal/milestone tracking, check-ins/feedback, and analytics cards/charts. Depends on steps 2 and 3.
6. Phase 6: AI and technical-depth layer. Add compatibility scoring logic and optional recommendation hints to strengthen innovation and technical-complexity judging criteria, while preserving admin final control. Depends on step 5.
7. Phase 7: Demo hardening and storytelling. Seed realistic sample data, add guardrails for no-auth demo mode, improve UX polish, and script a 3-5 minute demo sequence aligned to student impact + analytics + AI. Depends on steps 5 and 6.
8. Phase 8: Validation and submission prep. Run smoke tests across all key flows, verify dashboard metric correctness, polish README/docs, and finalize presentation artifacts. Depends on step 7.

**Relevant files**
- /c:/Users/alfri/Code-A-Thon/README.md — expand into project overview, setup, architecture summary, and demo walkthrough.
- /c:/Users/alfri/Code-A-Thon/docs/Student Kick-Off Call PresentationMM.pdf — reference judging expectations, challenge framing, and submission criteria.
- New application source directory to be created in implementation handoff (structure and stack to be selected in next planning iteration).

**Verification**
1. Functional walkthrough: mentee and mentor complete profiles, officer creates pair, participants message, goals/check-ins update, analytics reflects activity.
2. Data validation: compatibility score updates when profile attributes change and remains explainable to judges.
3. UX validation: desktop and mobile web flows complete within demo time constraints.
4. Demo readiness: execute the full script in one pass with seed data and no blocked states.
5. Documentation check: README reflects final architecture, feature scope, and run/demo instructions.

**Decisions**
- In scope: web app MVP, single-club deployment, mentees + mentors + club officers, manual admin matching, direct messaging, goals, check-ins, analytics.
- In scope: no-auth demo mode for speed, under-50 pilot assumptions.
- In scope: KPI emphasis on mentor-mentee meetings, survey data, compatibility scores.
- Out of scope for MVP: production-grade auth, multi-club tenancy, full mobile native apps, automated matching without admin review.
- Deadline anchor: March 23 submission/demo target.

**Further Considerations**
1. Stack choice recommendation: React + Firebase (fastest) versus Next.js + Supabase (more structure). Choose in next planning pass before implementation.
2. Analytics recommendation: define exact formulas for meeting frequency, engagement score, and compatibility confidence to avoid last-minute dashboard ambiguity.
3. Data ethics recommendation: include a short fairness note on compatibility scoring to strengthen judging narrative and trust.
