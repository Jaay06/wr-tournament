# Penpot realignment plan for Luna

## Mission

Bring the implemented Wild Rift tournament UI into visual and interaction alignment with the Penpot page `Rift Clash Screens • Revised`.

Preserve the working authentication, authorization, database, validation, and server-action behavior. Treat this as a UI realignment with two small correctness fixes already identified: invite intent is lost across authentication, and the displayed deadline countdown is hardcoded.

The work is done when every revised Penpot board has a matching code state at its desktop and mobile frame size, live data replaces sample values outside the development preview, and the verification checklist at the end passes.

## Source order

Use these sources in this order:

1. `/docs` defines business rules, access rules, data shape, and required behavior.
2. Penpot page `Rift Clash Screens • Revised` defines layout, hierarchy, component appearance, responsive composition, and visible copy.
3. The current code defines working implementation details that should survive the realignment.
4. Penpot page `Rift Clash Screens (Legacy)` is historical only.

When Penpot conflicts with a business or security rule in `/docs`, stop and ask the user. Do not silently choose one. Do not edit `/docs` or Penpot unless the user explicitly asks.

## Guardrails

- Preserve the existing dirty worktree. Start with `git status --short`, inspect overlapping edits, and never reset or discard them.
- Read `AGENTS.md`, `CONTEXT.md`, and every file in `/docs` before editing.
- This repository uses a changed Next.js version. Find and read the relevant guides under `node_modules/next/dist/docs/` before changing routes, server actions, navigation, or data loading.
- Use the Penpot MCP read-only. Call its high-level overview once, open `Rift Clash Screens • Revised`, inspect the named boards, and export the target desktop and mobile board before editing that screen.
- Use semantic Tailwind tokens from `app/globals.css`. Extract exact Penpot values before changing tokens. Do not guess colors, fonts, radii, or spacing.
- Keep authorization and validation on the server. A hidden or disabled control is not an authorization check.
- Keep mock names and fixed dates inside `/ui-preview` preview data. Production routes must use database values.
- Add no dependency unless the user approves it. The current Tailwind, Base UI, Lucide, and Motion packages cover this work.
- Keep motion short and secondary. Retain `MotionConfig reducedMotion="user"` and the global reduced-motion behavior.
- Do not commit, push, migrate the database, or modify schema as part of this plan unless the user asks. No schema change should be necessary.

## Required product decisions

Ask the user these questions before implementing the affected slice.

1. What may D01 reveal before authentication?
   - Recommended: validate the invite code on the server, then show only tournament name, region, and deadline. Store the accepted invite intent in a short-lived secure mechanism or preserve it in the encoded callback URL. Do not expose participants, teams, or announcements.
   - Reason: D01 shows a recognized invite before sign-in, while the current API and authentication docs restrict the tournament summary to signed-in users.
2. Where should the participant `Announcements` navigation item go?
   - Recommended: `/tournament#announcements` for the MVP because announcements already live on participant home and the docs do not require a separate page.

Record the answers in the implementation handoff. Update `/docs` only after separate user approval.

## Implementation handoff decisions

- Invite intent is preserved in the encoded `/invite?code=...` callback through sign-in, Discord OAuth, and account creation. The code is still validated and consumed only by the authenticated `joinTournament` server action; no participant or tournament data is disclosed before authentication.
- Participant `Announcements` points to `/tournament#announcements`, where the existing live announcement data remains available.
- The existing app remains the source of truth for authorization, deadline enforcement, tier limits, roster validation, one-team membership, and organizer repair. Penpot changes are presentational and do not replace those server rules.

## Board-to-code map

| Flow | Penpot boards | Current code |
|---|---|---|
| Design system | `00 • Design system` | `app/globals.css`, shared UI components |
| Private invite entry | `D01 • Private invite entry`, `M01 • Private invite entry` | `app/invite`, `app/signin`, `app/register`, `components/auth/entry-shell.tsx` |
| Player registration | `D02 • Player registration`, `M02 • Player registration` | `RegistrationView` in `components/tournament/tournament-app.tsx` |
| Participant home | `D03 • Participant home • Draft team`, `M03 • Participant home • Draft team` | `DashboardView` |
| Browse teams | `D04 • Browse teams • Eligible`, `M04 • Browse teams • Eligible` | `BrowseTeamsView` |
| Draft team room | `D05 • Team room • Captain draft`, `M05 • Team room • Captain draft` | `TeamRoomContent` |
| Submitted team room | `D05B • Team room • Submitted`, `M05B • Team room • Submitted` | submitted branch of `TeamRoomContent` |
| Organizer overview | `D06 • Organizer overview`, `M06 • Organizer overview` | `OrganizerOverview`, `app/admin/page.tsx` |
| Organizer tier review | `D07 • Organizer tier review`, `M07 • Organizer tier review` | `OrganizerTierReview`, `app/admin/tier-review/page.tsx` |

`app/ui-preview/page.tsx` is the comparison harness. Keep it available in development and make its fixtures match the Penpot examples so visual differences are easy to spot.

## Known gaps to resolve

- Participant navigation uses `Home`, `Browse teams`, and `Team room`. Penpot uses `Overview`, `My team`, `Browse teams`, and `Announcements`, with tier and deadline status pills.
- `/invite?code=...` redirects an unauthenticated user to a callback that drops the code.
- `DeadlineBanner` displays `6 days, 14 hours` for every live deadline.
- Current typography, card radius, section spacing, and information density differ from Penpot. Extract exact values from `00 • Design system` before changing them.
- Registration contains the correct fields but uses a different desktop hierarchy.
- Participant home promotes a full-width deadline banner instead of Penpot's compact status row.
- Browse teams lacks Penpot's eligibility explanation and full filter set.
- The `renameTeam` server action exists but the captain UI does not expose it.
- Team room displays a hardcoded `VH-8421` team invite code. The product rules and revised Penpot design use targeted player invitations instead.
- Submitted team room lacks Penpot's submission receipt and organizer-unlock guidance.
- Organizer overview gives the review table more prominence than the revised action queue, metrics, and settings summary.
- Tier review shows one record without the revised searchable queue beside it.
- Mobile currently stacks the desktop composition and uses a generic menu. Penpot provides purpose-built 390 px boards.

## Execution sequence

Work through the phases in order. Finish and verify one phase before starting the next. Keep functional fixes separate from broad visual edits so regressions are easy to locate.

### Phase 0. Baseline and design inventory

Actions:

1. Read the required repository and Next.js documentation.
2. Capture `git status --short`. Treat every existing change as user-owned.
3. Run the current app and capture each `/ui-preview?screen=...` state at 1440 by 900 and 390 by 844.
4. Capture `/signin`, `/register`, and the reachable invite state.
5. In Penpot, inspect `00 • Design system`, then export every D and M board listed above.
6. For shared shapes, inspect generated CSS or shape properties for color, font family, font size, line height, weight, radius, border, shadow, padding, and gap.
7. Write a short working checklist that maps each observed Penpot value to an existing token or a proposed token.

Completion criterion:

- Every target board has a corresponding baseline code screenshot and an exact token/layout note. No code has changed yet.

### Phase 1. Shared visual system and app header

Likely files:

- `app/globals.css`
- `app/layout.tsx`
- `components/tournament/tournament-app.tsx`
- shared files under `components/ui`

Actions:

1. Map Penpot colors, typography, radii, borders, and spacing to semantic CSS variables and Tailwind theme entries.
2. Change shared tokens before applying one-off classes. Keep tier tokens and accessible foreground colors.
3. Realign the brand block, page width, header height, navigation spacing, active item, status pills, and mobile header.
4. Rename participant navigation to match Penpot. Apply the user's decision for `Announcements`.
5. Feed the header live approved-tier and deadline state. Show a truthful pending or incomplete state when data is unavailable.
6. Extract a shared tournament shell only if it reduces repeated edits. Avoid a wholesale component rewrite before the first visual checkpoint.

Completion criterion:

- One shared header and token set reproduces `00 • Design system` on participant and organizer screens at both target widths. Keyboard focus is visible, status is never communicated by color alone, and no route behavior changed.

### Phase 2. Deadline data correctness

Likely files:

- `lib/tournament.ts`
- tournament and admin route pages that pass deadline props
- `components/tournament/tournament-app.tsx`

Actions:

1. Replace the hardcoded relative time with a helper that accepts a deadline and an optional `now` value for deterministic tests.
2. Return an explicit state for open, future, and passed deadlines.
3. Pass absolute and relative labels from server routes to the client component. Avoid a hydration-dependent client calculation.
4. Keep the development preview deterministic with a fixed example value.
5. Add focused tests using the existing `tsx` dependency. Cover open, future, less-than-one-hour, and passed cases.

Completion criterion:

- No production screen contains a fixed countdown. Absolute and relative deadline labels agree for all tested states.

### Phase 3. Private invite and authentication entry

Likely files:

- `app/invite/page.tsx`
- `app/invite/invite-form.tsx`
- `app/signin/page.tsx`
- `app/register/page.tsx`
- `components/auth/entry-shell.tsx`
- `lib/redirect.ts`
- `app/ui-preview/page.tsx`

Actions:

1. Implement the user's pre-auth disclosure decision.
2. Preserve the full invite intent through credentials sign-in, Discord sign-in, account creation, and authentication failure recovery.
3. Build the D01/M01 composition with recognized-invite, deadline, private-access, Discord, and email/password states.
4. Keep invalid, closed, replaced, and missing invite states explicit. Do not reveal whether an account exists.
5. Extract a presentational invite-entry component so the development preview can render D01 without a real session or database mutation.
6. Verify that the code is consumed once on successful join and remains available after a recoverable auth error.

Completion criterion:

- Starting at `/invite?code=<valid example>`, a signed-out user can authenticate and return with the invite still present. D01 and M01 match Penpot, and invalid or closed codes do not grant access.

### Phase 4. Player registration

Likely files:

- `components/tournament/tournament-app.tsx`
- `app/tournament/register/page.tsx`
- existing form and field components

Actions:

1. Recompose the screen to match D02/M02. Use the Penpot intro, authenticated-account summary, "what happens next" guidance, player-details card, tier selection, and submit hierarchy.
2. Keep one short form with Riot name, Riot tag, rank, primary role, secondary role, and self-assessed tier.
3. Keep rank mapping visible beside or within the tier control exactly as the responsive board shows.
4. Preserve field values and field-level server errors after recoverable failures.
5. Retain the pending-review success state and the ability to continue to team formation.

Completion criterion:

- D02 and M02 match in hierarchy, copy, spacing, and states. Saving and editing a registration still trigger the existing server rules.

### Phase 5. Participant home

Likely files:

- `components/tournament/tournament-app.tsx`
- `app/tournament/page.tsx`
- `lib/tournament-data.ts` only if the target needs already-available data in a different shape

Actions:

1. Match D03/M03's compact profile, deadline, and notification status row.
2. Recompose the team summary, five starter slots, validation message, announcements, and direct notifications to the target grid.
3. Bind badges and counts to live registration, team, announcement, and notification values.
4. Preserve the no-registration, pending-tier, no-team, draft-team, and submitted-team branches.
5. Add the target `id` for the announcements navigation destination if the user chose an anchor.

Completion criterion:

- D03 and M03 match with preview data. Every live empty or pending branch remains understandable and actionable.

### Phase 6. Browse teams

Likely files:

- `components/tournament/tournament-app.tsx`
- `app/tournament/teams/page.tsx`
- `lib/tournament-data.ts` if a missing derived count is required

Actions:

1. Match D04/M04's intro, search, filters, eligibility notice, and three-card layout.
2. Update development fixtures to the same team names, captains, member counts, tier totals, and states shown in Penpot.
3. Derive join eligibility from the current participant, team state, roster size, registration state, and deadline. Never hardcode it.
4. Keep submitted and full-team actions disabled with a visible explanation.
5. Preserve request success, conflict, and empty-search states.

Completion criterion:

- D04 and M04 match, filters work, and a participant already on a team cannot send another request.

### Phase 7. Draft team room

Likely files:

- `components/tournament/tournament-app.tsx`
- `app/tournament/team/page.tsx`
- `app/tournament/actions.ts`

Actions:

1. Recompose the header, captain controls, five starters, substitutes, invitations, requests, validation, and submit action to D05/M05.
2. Wire the existing `renameTeam` action to the Penpot captain control. Use an accessible inline form or existing dialog primitives. Keep routine rename reversible and avoid a confirmation modal.
3. Keep targeted player invitations and join requests. Remove the hardcoded `VH-8421` team invite code and related clipboard state.
4. Show all blocking issues in plain language. Keep role warnings visually separate and non-blocking.
5. Keep lineup editing available only to the draft captain before the deadline.
6. Make preview roster data match Penpot, including the actual substitute and warning example.

Completion criterion:

- D05 and M05 match. Captain rename, invite, request resolution, lineup save, and submission still call the existing secured actions. Non-captains and submitted teams cannot edit.

### Phase 8. Submitted team room

Likely files:

- submitted branch of `TeamRoomContent`
- preview data for `screen=submitted`

Actions:

1. Match D05B/M05B's locked banner, submitted roster, submission receipt, and "need a change" guidance.
2. Remove all participant edit controls from the submitted branch.
3. Display the real submitted timestamp and roster totals when available. Add the timestamp to the team view model only if the database already stores it.
4. Keep organizer unlock and repair controls in organizer-only team management, clearly separated from participant guidance.

Completion criterion:

- D05B and M05B match. Participant controls are absent, the receipt reflects live roster data, and the organizer workflow remains reachable.

### Phase 9. Organizer overview

Likely files:

- `components/tournament/tournament-app.tsx`
- `app/admin/page.tsx`
- `lib/tournament-data.ts`

Actions:

1. Match D06/M06's intro, tournament status, metrics, action queue, and settings summary hierarchy.
2. Keep pending tier reviews ahead of secondary information without turning the page into a large moderation table.
3. Bind joined, registered, pending, draft, submitted, and blocked counts to live data.
4. Keep settings, invite management, and announcement forms reachable below the overview or through the target navigation.
5. Preserve organizer-only route and action checks.

Completion criterion:

- D06 and M06 match. Every displayed metric equals the database result, and all organizer forms remain usable by keyboard.

### Phase 10. Organizer tier review

Likely files:

- `components/tournament/tournament-app.tsx`
- `app/admin/tier-review/page.tsx`
- `lib/tournament-data.ts`

Actions:

1. Replace the isolated record layout with D07/M07's search field, pending queue, selected registration, rank context, and approval controls.
2. Return a tier-review workspace data shape containing the queue and selected registration. Reuse the existing pending query rather than fetching it twice.
3. Keep selection in the URL with the registration identifier so refresh and back navigation are stable.
4. Filter search locally when the queue is already loaded and small. Keep the current server ordering as the source order.
5. After approval, remove the item from the visible queue, select the next pending item, announce success, and show the clear state when none remain.
6. Preserve team revalidation and participant notification behavior in the existing approval action.

Completion criterion:

- D07 and M07 match. Search, selection, approval, next-item behavior, empty state, and URL refresh all work without weakening organizer authorization.

### Phase 11. Responsive, accessibility, and motion pass

Actions:

1. Compare every D board at 1440 by 900 and every M board at 390 by 844.
2. Check 320, 768, 1024, and 1440 CSS-pixel widths for overflow and awkward wrapping.
3. Keep all interactive targets at least 44 CSS pixels where practical.
4. Verify one clear `h1`, ordered heading levels, landmarks, labels, error associations, live regions, and visible keyboard focus.
5. Verify status text accompanies every status color.
6. Test the mobile navigation with keyboard and touch.
7. Test normal and reduced motion. Reduced motion should remove travel and scale while preserving state changes.
8. Inspect the browser console and network panel on each route.

Completion criterion:

- No horizontal overflow, inaccessible control, motion-only state, console error, or target-size regression remains on any revised screen.

### Phase 12. Final verification and handoff

Run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm exec tsx --test lib/tournament.test.ts
pnpm build
git diff --check
```

With the development server running at `http://localhost:3000`, also run:

```bash
pnpm test:homepage
```

If a command cannot run because an external service is unavailable, record the exact command and error. Do not report it as passing.

Then:

1. Capture final code screenshots beside every revised Penpot board at the target frame size.
2. Walk the signed-out invite flow, participant registration flow, team captain flow, submitted-team flow, organizer overview, and tier approval flow.
3. Search production code for stale preview strings such as `VH-8421`, fixed countdowns, and Penpot sample names.
4. Review the final diff for unrelated edits and accidental changes to `/docs`.
5. Report changed files, verified commands, remaining visual differences, and any user decision still open.

Final completion criterion:

- Every revised board has a matching verified code state, all required commands pass or have an exact external blocker, business rules still hold, and no unexplained divergence remains.
