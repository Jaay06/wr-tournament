# Development roadmap

The roadmap deliberately stops at the private friends-tournament experience. Build and verify each slice before starting the next.

## Phase 1: Foundation

- [x] Confirm the Paper design can be translated into the current Next.js application.
- [x] Scaffold the Next.js application with TypeScript and Tailwind CSS.
- [ ] Add shared UI primitives that follow the Paper design.
- [x] Add Neon PostgreSQL and Drizzle ORM.
- [x] Create and run the initial migration against Neon.
- [x] Add setup support for the singleton tournament and organizer.
- [ ] Add automated checks for schema constraints and core validation rules.

## Phase 2: Authentication and private entry

- [x] Add Discord OAuth wiring.
- [x] Add email and password registration and sign-in.
- [ ] Add password-reset email flow.
- [x] Add secure sessions and route protection.
- [x] Add the private tournament invite flow.
- [ ] Add organizer controls to close and replace the invite.

Acceptance: a friend can authenticate and enter the tournament only with the active invite; an outsider cannot view tournament data.

## Phase 3: Registration and tier review

- [ ] Build the player registration form.
- [ ] Show the default T1–T4 rank mapping.
- [ ] Build the participant registration-status view.
- [ ] Build the organizer's pending tier-review queue.
- [ ] Notify a participant when a tier is approved or adjusted.
- [ ] Enforce registration edits and review resets.

Acceptance: a participant can register, and the organizer can approve the tier used by roster validation.

## Phase 4: Team formation

- [ ] Create and browse draft teams.
- [ ] Add captain ownership.
- [ ] Add targeted team invitations.
- [ ] Add team join requests.
- [ ] Enforce one team per player and a seven-player maximum.
- [ ] Build five starter slots and two substitute slots.
- [ ] Show approved tiers and role preferences in the team room.

Acceptance: friends can form a complete draft roster without violating membership or capacity rules.

## Phase 5: Validation, submission, and deadline

- [ ] Implement full-roster tier validation.
- [ ] Show blocking errors separately from role warnings.
- [ ] Add captain submission and submitted-team locking.
- [ ] Enforce the deadline on every participant mutation.
- [ ] Add organizer unlock and repair controls.
- [ ] Revalidate teams after tier and membership changes.

Acceptance: only a valid roster can be submitted before the deadline, and server-side checks cannot be bypassed.

## Phase 6: Communication and polish

- [ ] Add the announcement feed and organizer management.
- [ ] Add direct in-app notifications and read state.
- [ ] Complete responsive and keyboard behavior.
- [ ] Add empty, loading, error, closed, and expired states.
- [ ] Add reduced-motion support.
- [ ] Run end-to-end tests for participant, captain, and organizer paths.
- [ ] Perform deployment and security checks.

Acceptance: the complete friend-group flow works on mobile and desktop and is ready for a private tournament.

## Later only if the group asks

- Team logos.
- A second organizer.
- Discord role synchronization.
- Bracket-tool integration.
- Match scheduling and results.

These are not MVP commitments and should not shape the initial data model or interface.
