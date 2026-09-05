# Development roadmap

Reviewed against the working tree on 2026-09-05. Checked items mean the implementation exists, not that production deployment or all acceptance scenarios have been verified. Acceptance statements below remain the criteria for end-to-end testing.

## Phase 1: Foundation

- [x] Implement the tournament interface.
- [ ] Verify the implemented screens against the current Brilliant design identified in `UI_UX_GUIDELINES.md`.
- [x] Scaffold the Next.js application with TypeScript and Tailwind CSS.
- [x] Add shared Tailwind and Base UI components.
- [x] Add Neon PostgreSQL and Drizzle ORM.
- [x] Commit the initial schema and follow-up migrations for constraints and a nullable deadline.
- [ ] Verify all committed migrations are applied in the target deployment.
- [x] Add setup support for the singleton tournament and organizer.
- [x] Add helper tests for roster validation, lineup arrangement, captain exit behavior, deadlines, invite callbacks, reset tokens, email configuration, rate limits, and deployment configuration.
- [ ] Add database integration tests for schema constraints and concurrent mutations.

## Phase 2: Authentication and private entry

- [x] Add Discord OAuth wiring.
- [x] Add email and password registration and sign-in.
- [x] Add password-reset email flow.
- [x] Add secure sessions and route protection.
- [x] Add the private tournament invite flow.
- [x] Add organizer controls to set or extend the deadline, close or reopen the invite, and replace the invite.

Acceptance: a friend can authenticate and enter the tournament only with the active invite; an outsider cannot view tournament data.

## Phase 3: Registration and tier review

- [x] Build the player registration form.
- [x] Show the default T1–T4 rank mapping.
- [x] Build the participant registration-status view.
- [x] Build the organizer's pending tier-review queue.
- [x] Notify a participant when a tier is approved or adjusted.
- [x] Enforce registration edits and review resets.

Acceptance: a participant can register, and the organizer can approve the tier used by roster validation.

## Phase 4: Team formation

- [x] Create and browse draft teams.
- [x] Add captain ownership.
- [x] Add targeted team invitations.
- [x] Add team join requests.
- [x] Enforce one team per player and a seven-player maximum.
- [x] Build five starter slots and two substitute slots.
- [x] Show approved tiers and role preferences in the team room.

Acceptance: friends can form a complete draft roster without violating membership or capacity rules.

## Phase 5: Validation, submission, and deadline

- [x] Implement full-roster tier validation.
- [x] Show blocking errors separately from role warnings.
- [x] Add captain submission and submitted-team locking.
- [x] Enforce the deadline on participant registration and roster mutations. Invite entry and notification read state remain available.
- [x] Add organizer unlock and repair controls.
- [x] Revalidate teams after tier and membership changes.

Acceptance: only a valid roster can be submitted before the deadline, and server-side checks cannot be bypassed.

## Phase 6: Communication and polish

- [x] Add the announcement feed and organizer management.
- [x] Add direct in-app notifications and read state.
- [x] Implement responsive layouts and keyboard controls.
- [ ] Complete browser, mobile, keyboard, and reduced-motion verification.
- [x] Add empty, loading, error, closed, and expired states.
- [x] Add reduced-motion support.
- [ ] Run end-to-end tests for participant, captain, and organizer paths.
- [ ] Perform deployment and security checks.

Acceptance: the complete friend-group flow works on mobile and desktop and is ready for a private tournament.

## Additional implemented work

- Public homepage, how-it-works, rules, and tier pages, plus metadata and social cards.
- Private participant directory and player/team detail pages.
- Captain transfer and deletion of a sole-member draft team.
- Dedicated participant and organizer announcement routes.
- Development UI preview and homepage/rules smoke script.

## Remaining gaps

- Manual organizer reopening of tier review and dedicated review metadata remain pending a scope decision. Approval and tier adjustment already work.
- Authentication, registration, and invite entry still need deployment-appropriate rate limiting. The password-reset limiter is process-local.
- Confirm SMTP delivery and Discord OAuth in the target environment.
- Standardize action error shapes and field errors if the broader API contract is retained.
- Run database concurrency and authenticated end-to-end tests before treating the MVP as release-ready.

## Later only if the group asks

- Team logos.
- A second organizer.
- Discord role synchronization.
- Bracket-tool integration.
- Match scheduling and results.

These are not MVP commitments and should not shape the initial data model or interface.
