# Captain snake draft handover

Status: design pass complete; planning PR. Intended owner: GPT Luna, model `gpt-5.6-luna`, reasoning effort `max`. The Brilliant review artifacts are recorded below; the feature is not implemented.

## Confirmed request

Captain drafting is an optional organizer-selected formation mode. Team creators are the playing captains, and only captain-only teams can enter the draft. Captains select one available player per turn; a pick assigns immediately without player acceptance. The roster target is five total players including the captain.

The organizer randomizes the initial team order and locks the participating teams plus the approved unteamed player pool when the draft starts. Existing invitation and join-request formation remains available when draft mode is off. Existing caps apply and count captains: one T1 player and two T2 players per team; full teams skip turns.

The tier sequence is exactly one full T1 round, two T2 rounds, then T3 until exhausted, then T4 until exhausted. Snake direction reverses after every round and continues across tier boundaries. If a tier empties mid-round, remaining picks in that round are skipped and the next tier begins while preserving snake round progression. If T4 exhausts before every team reaches five, the draft ends and incomplete teams are flagged for organizer repair.

For four teams with no skipped turns, the snake is A B C D, then D C B A, then A B C D. The endpoint team picks on consecutive turns at round boundaries.

The user requested this new feature even though `docs/specifications.md` lists drafts outside the original MVP. This authorizes planning the expansion, not silently rewriting existing team rules. Keep `/docs` unchanged until the user authorizes specific updates.

## Confirmed behavior and implementation audit

Confirmed follow-up decision: drafting is an optional organizer-selected mode. Preserve the invitation and join-request flow when draft mode is inactive.

Turns use a 60-second default timer. At expiry, the server randomly selects an eligible available player from the current tier, respecting roster caps, unless the organizer has paused the draft. Pausing freezes remaining time; resuming continues it. The organizer can add or subtract seconds, pick for an absent captain, pause/resume the draft, or undo the latest committed pick. Undo returns the player to the pool, restores that captain's turn, and starts a fresh 60 seconds.

No product decisions remain open in this pass. The implementation audit must preserve the locked team and pool snapshot, enforce the captain-only boundary, resolve manual picks and expiry atomically so at most one commits, and restore the turn plus a fresh 60 seconds on undo.

## Design first in Brilliant

Reading this as: an extension of the private tournament room for captains and friends, with the existing restrained navy and yellow language, using the current Rift Clash design system.

Use `/Users/jay/.agents/skills/design-taste-frontend/SKILL.md`. Its dense product UI and realtime collaboration exclusions apply to this screen. Use the existing Base UI components for interaction patterns and the Brilliant app frames for visual decisions. Apply relevant typography, consistency, accessibility, state completeness, and copy checks. Marketing hero, decorative image, bento, and landing-page density rules are not draft-room requirements.

Provisional design dials: `DESIGN_VARIANCE: 3`, `MOTION_INTENSITY: 3`, `VISUAL_DENSITY: 6`. Predictable placement and visible turn information matter during picks. Match existing typography, tier accents, radii, navigation, and theme. Any new theme or navigation change needs direction from the user.

1. Read `AGENTS.md`, all current product docs, and especially `docs/UI_UX_GUIDELINES.md`. Inspect implementation rather than assuming docs capture every recent change.
2. Initialize Brilliant project `Scratch`, key `/Users/jay/.config/brilliant/scratch`, canvas `rift-clash/app-screens-redesign`. Reinitialize for your own session ID and pass it to mutations.
3. Inspect frame properties and export these references before drawing:

   | Reference | Desktop ID | Mobile ID |
   | --- | --- | --- |
   | 03 Participant Team Room | `1a524431ce689c34` | `b496b34654fb2ffd` |
   | 05 Participant Directory | `b2e72eb234455e01` | `55c960d9cad7f2f0` |
   | 08 Organizer Team Oversight | `db624bc8d4f86781` | `0f9069f186b92801` |

   IDs were discovered through Brilliant on 2026-09-06. Re-query if changed. The generic Brilliant default token catalog is not the Rift Clash visual specification. Existing frames use navy `#0A0F1B`, sidebar `#0E1726`, and borders `#28384F`; inspect descendants for full typography and action tokens.

4. Modify the canonical draft proposal frames in place without overwriting approved references. Design desktop and mobile views for organizer setup, captain's active turn, waiting captain, participant viewing, and completed draft. Show current captain, round, active tier, direction, upcoming turns, eligible players, roster, and pick history. Clearly label sample content.
5. Add state variants for selected player, pick pending, rejected/stale pick, connection loss and resync, no eligible players, tier transition, incomplete roster, active timer, paused timer, expiry auto-pick, organizer pick-for-absent, and undo-latest-pick. Keep these states in the canonical proposal frames and state gallery.
6. Keep active-turn status and the pick action reachable on mobile. Explain disabled picks with text. Plan keyboard selection, focus after a pick, screen-reader turn announcements, and stable player-list updates. Use short feedback only, with reduced-motion alternatives if motion is added.
7. Export and visually inspect every proposed frame. Check clipping, contrast, long names, empty pools, small screens, and semantic tier labels. Present frame IDs and previews with the implementation audit attached.

Completion criterion: user has reviewed the concrete Brilliant flow and resolved missing design states before application UI implementation. This follows the repository's requirement to ask for direction on missing states and changed designs. Draft approval is separate from deployment or merge.

## Design review artifacts

The design pass is complete for review on 2026-09-06. Existing canonical proposal roots were updated in place; no replacement draft screens or application implementation are included in this handover.

Canvas: Brilliant project `Scratch`, canvas `rift-clash/app-screens-redesign`.

The compact walkthrough map is rooted at `2e24db55e1344f79` (`START HERE - Player draft flow`) at the far-right overview area. It shows setup → active captain → next captain → completion, with a repeat loop and notes for timer expiry, pause/resume, organizer picks, and undo. The existing draft screens now have descriptive names for navigation.

Final Brilliant frame roots:

| Flow | Desktop root | Mobile root |
| --- | --- | --- |
| Organizer setup | `82c545fa3269315d` | `65b340c7b7495ab3` |
| Captain active turn | `ee33499bb76653b1` | `fd5f88ef5cd38b3c` |
| Waiting captain | `e85c240646a63121` | `2220d0ab9c883a4c` |
| Participant view | `1bac9c93f3f183e9` | `68252803aaeee732` |
| Completed draft | `eb38caef2c36de82` | `8363d1c13103ba4d` |
| Variable-team snake board (corrected) | `68ddb41f784e04d2` | `b3f3b8448676a171` |
| Draft state gallery (corrected) | `96b1c099d9130cdc` | `57acfee01d2daab4` |

The board uses six teams as a variable-count example. Each team keeps a readable minimum-width column inside a horizontally scrollable board; the round/path rail remains pinned, and `Jump to current pick` is available. The sample has picks 01–07 completed, pick 08 active for Team E / captain Kelechi, and pick 09 next for Team D. All six sample captain names are filled. Round labels and the footer path show forward/reverse direction, while tier phase remains a separate label from round.

The corrected active, waiting, and setup frames now show the 60-second timer, T2 round labels, captain-only setup, randomized start order, locked teams and approved pool, full-team skips, and organizer-controlled timer language. The state gallery covers an active timer, pause and ± time controls, expiry auto-pick, organizer pick-for-absent, undo-latest-pick, rejected/stale, reconnecting with the last confirmed server state, no eligible players, tier transition, and T4-exhaustion repair. Its copy avoids promising local authority and keeps implementation audit notes outside the simulated product UI. The separate canvas note `1171e8d436c3d85e` (`Draft board review notes`) records confirmed rules and the server-side implementation audit.

Inspected preview exports:

- `/private/tmp/luna-snake-board-variable-desktop-final.png`
- `/private/tmp/luna-snake-board-variable-mobile-final.png`
- `/private/tmp/luna-active-desktop-rules-final.png`
- `/private/tmp/luna-active-mobile-rules-final.png`
- `/private/tmp/luna-setup-desktop-rules-final.png`
- `/private/tmp/luna-setup-mobile-rules-final.png`
- `/private/tmp/luna-waiting-desktop-rules-final.png`
- `/private/tmp/luna-waiting-mobile-rules-final.png`
- `/private/tmp/luna-state-gallery-desktop-rules-final.png`
- `/private/tmp/luna-state-gallery-mobile-rules-final.png`
- `/private/tmp/luna-snake-review-note-rules-final.png`

## Implementation plan after decisions and design review

Inspect `db/schema.ts`, `lib/tournament-rules.ts`, `lib/tournament.ts`, `lib/tournament-data.ts`, `lib/room-page-data.ts`, tournament/admin actions, and `components/tournament/`. Read relevant installed Next.js guides under `node_modules/next/dist/docs/` before writing code. Confirm dependencies from `package.json`.

- Define a pure turn scheduler from the agreed rules: randomized initial order, one T1 round, two T2 rounds, T3/T4 until exhaustion, full-team skips, tier-empty mid-round skips, and snake continuation across tier boundaries. Persist the initial order and the locked team/pool snapshot so reconnects cannot reshuffle or expand eligibility. Distinguish a live draft session from the existing team status named `draft`.
- Propose Drizzle records for a draft session, ordered teams, eligible pool, and committed picks. Include authoritative session state/version and uniqueness for turn and drafted player. Exact columns follow the approved lifecycle. Generate and apply migrations in the test environment before schema-dependent tests.
- Keep authorization and pick validation server-side. A pick must check participation, captain-only setup, captain ownership, active session/turn, tier eligibility, pool membership, existing membership, roster capacity, and the 60-second deadline. Manual picks and expiry auto-picks must commit through one atomic compare-and-set path, with a random legal player at expiry, and retries must be idempotent.
- Reconcile the current membership model before coding. The draft target is five total players including the captain; preserve the existing role and submission constraints, and present any role-at-pick or staging-model change for approval.
- Persist the organizer controls: pause/resume with remaining time frozen, add/subtract seconds, pick for an absent captain, and undo latest pick. Undo must return the player to the pool, restore the captain's turn, and start a fresh 60 seconds atomically.
- Apply the active-draft policy to every competing mutation, including invitation/request acceptance, leaving, captain transfer, team deletion, organizer repairs, and tier changes. These must share transactional checks so simultaneous requests cannot bypass the draft.
- Use existing authenticated loaders/actions and UI components. Recommend a synchronization approach after inspecting hosting constraints; agree on the UX and dependency tradeoff before adding infrastructure. Resync from the server after reconnects or stale requests. Client clocks and disabled buttons never determine eligibility.
- Complete the agreed handoff into lineup assignment and existing roster validation/submission. Preserve one team per registration, exactly one captain, and any retained tier/capacity rules.

Completion criterion: reviewed designs and agreed policies are implemented with atomic persistence and no regression in the retained formation flow.

## Verification and delivery

- Scheduler tests: two, three, and four teams; randomized initial order; one T1 round; two T2 rounds; T3/T4 exhaustion; direction reversals; tier-empty mid-round skips; capped/full teams; incomplete teams after T4; and draft completion. Expected results must come from the agreed rules.
- Database tests: simultaneous manual/expiry picks for one turn/player, random legal expiry selection, repeated requests, stale versions, pause/resume, add/subtract time, undo restoration with fresh 60 seconds, locked team/pool mutations, restart/resume, and racing organizer repairs. Exactly one valid commit should win a contested turn.
- Access tests: signed-out user, nonparticipant, ordinary participant, wrong captain, active captain, and organizer. Private draft data stays private.
- Browser checks: active pick and waiting view across two sessions, mobile/desktop, keyboard, reduced motion, network failure/reconnect, and final lineup/submission. Exercise optional mode's existing invitation flow if retained.
- Run repository lint, test, and build scripts appropriate to the changed files. Record actual results and remaining gaps, not planned checks as passed checks.
- Update this PR with final scope, approved Brilliant IDs/previews, migration instructions, and test evidence. Request feedback before further features. Merge and deployment are separate actions.

## Starting prompt for Luna

Use GPT Luna with max reasoning. Read `SNAKE_DRAFT_HANDOVER.md` and current repository instructions. Use the confirmed behavior above and the existing Brilliant references. Design the captain snake-draft flow in Brilliant MCP using the contextual guidance from design-taste-frontend and the current Rift Clash visual language. Show desktop/mobile frames and state variants for review before implementation. Carry forward the user's decisions from the originating conversation; no product questions remain in this handoff. Continue on this planning PR's branch when implementation is authorized; preserve unrelated changes.
