# Maventor Mermaid Diagrams

This folder contains Mermaid source files for Maventor architecture and product flow documentation.

## Diagram Catalog

1. data-flow.mmd
Purpose: End-to-end movement of profile, pairing, messaging, check-in, scoring, and analytics data.

2. erd-conceptual.mmd
Purpose: Conceptual entity relationship model with cardinality.

3. erd-implementation-map.mmd
Purpose: Mapping of conceptual entities to likely Firebase and Supabase schema options.

4. user-flow-mentee.mmd
Purpose: Mentee navigation and task journey.

5. user-flow-mentor.mmd
Purpose: Mentor navigation and task journey.

6. user-flow-officer.mmd
Purpose: Officer workflow for pairing and program oversight.

7. sequence-pairing-to-checkin.mmd
Purpose: Runtime interaction sequence from manual pairing to first KPI update.

8. state-pairing-lifecycle.mmd
Purpose: Status transitions for mentorship pairings.

## Shared Conventions

- Canonical term: pairing
- Role labels: mentee, mentor, officer
- Snake case for event labels, tables, and data-store names
- Keep flows demo-friendly: each diagram should be readable in under one minute

## Suggested Reading Order

1. user-flow-officer.mmd
2. user-flow-mentee.mmd
3. user-flow-mentor.mmd
4. data-flow.mmd
5. sequence-pairing-to-checkin.mmd
6. erd-conceptual.mmd
7. erd-implementation-map.mmd
8. state-pairing-lifecycle.mmd
