# Captain snake draft handover

Status: design pass complete; planning PR. Intended owner: GPT Luna, model `gpt-5.6-luna`, reasoning effort `max`. The Brilliant review artifacts are recorded below; the feature is not implemented.

## Confirmed request

Captains select one available player per turn. Team order reverses after each round. Players become selectable by tier, starting with T1, then T2, T3, and T4.

For four teams with no skipped turns, the snake is A B C D, then D C B A, then A B C D. The endpoint team picks on consecutive turns at the round boundary. Tier-phase boundaries and skipped turns still need an explicit rule.

The user requested this new feature even though `docs/specifications.md` lists drafts outside the original MVP. This authorizes planning the expansion, not silently rewriting existing team rules. Keep `/docs` unchanged until the user authorizes specific updates.

## Resolve before finalizing behavior

Confirmed follow-up decision: drafting is an optional organizer-selected mode. Preserve the invitation and join-request flow when draft mode is inactive.

Questions presented to the user:

- Formation mode: answered. Optional draft mode.
- Do existing tier caps apply, counting captains, and do capped teams skip turns? Recommendation: preserve caps and advance tiers when no legal picks remain. Clarify whether each tier has one round or repeats until its eligible pool is exhausted.
- Who selects captains and the initial order, and are turns timed? Recommendation: organizer chooses captains and order, with no timer initially.

Ask the remaining questions after those answers, without treating recommendations as decisions:

- Are captains preassigned playing members, and can existing teams enter with other members? How are team count and the draft pool fixed?
- Is the target five total players including the captain, or are substitutes drafted up to seven? What happens to undrafted players and incomplete teams?
- Does snake direction continue across tier changes or reset for each tier? Define round completion when teams skip or a tier runs out mid-round.
- Does a pick immediately assign the player, or require player acceptance? Can picks be undone, and by whom?
- Can the organizer pause, resume, cancel, or pick for an absent captain? If a timer is chosen, define expiry behavior and disconnect handling.
- How do the registration deadline, tier edits, withdrawals, captain transfer, and organizer roster repairs interact with an active draft?

Completion criterion: record user decisions here, with small examples covering exhausted tiers, capped teams, and incomplete rosters. No invented fallback policies.

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

4. Add separately named draft proposal frames without overwriting approved references. Design desktop and mobile views for organizer setup, captain's active turn, waiting captain, participant viewing, and completed draft. Show current captain, round, active tier, direction, upcoming turns, eligible players, roster, and pick history. Clearly label sample content.
5. Add state variants for selected player, pick pending, rejected/stale pick, connection loss and resync, no eligible players, tier transition, and incomplete roster. Add pause, timer, undo, or cancellation variants only if their behavior is agreed.
6. Keep active-turn status and the pick action reachable on mobile. Explain disabled picks with text. Plan keyboard selection, focus after a pick, screen-reader turn announcements, and stable player-list updates. Use short feedback only, with reduced-motion alternatives if motion is added.
7. Export and visually inspect every proposed frame. Check clipping, contrast, long names, empty pools, small screens, and semantic tier labels. Present frame IDs and previews to the user with unresolved decisions attached to the affected states.

Completion criterion: user has reviewed the concrete Brilliant flow and resolved missing design states before application UI implementation. This follows the repository's requirement to ask for direction on missing states and changed designs. Draft approval is separate from deployment or merge.

## Design review artifacts

The design pass is complete for review on 2026-09-06. No application implementation is included in this handover.

Canvas: Brilliant project `Scratch`, canvas `rift-clash/app-screens-redesign`.

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

The corrected state gallery covers selected, waiting, rejected/stale, reconnecting with the last confirmed server state, no eligible players, tier transition, and incomplete roster. Its copy avoids promising local authority and does not invent a roster-completion policy. The separate canvas note `1171e8d436c3d85e` (`Draft board review notes`) contains design annotations and unresolved policy questions outside the simulated product UI.

Inspected preview exports:

- `/private/tmp/luna-snake-board-variable-desktop-final.png`
- `/private/tmp/luna-snake-board-variable-mobile-final.png`
- `/private/tmp/luna-state-gallery-desktop-final-corrected.png`
- `/private/tmp/luna-state-gallery-mobile-final-corrected.png`
- `/private/tmp/luna-snake-review-note-final.png`

The open policy questions remain the ones listed above: tier caps and empty-pool behavior, roster size and completion, timer/expiry, pick undo/acceptance, and direction at tier boundaries. The frames keep those decisions out of the user flow until they are answered.

## Implementation plan after decisions and design review

Inspect `db/schema.ts`, `lib/tournament-rules.ts`, `lib/tournament.ts`, `lib/tournament-data.ts`, `lib/room-page-data.ts`, tournament/admin actions, and `components/tournament/`. Read relevant installed Next.js guides under `node_modules/next/dist/docs/` before writing code. Confirm dependencies from `package.json`.

- Define a pure turn scheduler from the agreed rules. Track tier phase and snake round separately. Persist the initial team order so reconnects cannot reshuffle it. Distinguish a live draft session from the existing team status named `draft`.
- Propose Drizzle records for a draft session, ordered teams, eligible pool, and committed picks. Include authoritative session state/version and uniqueness for turn and drafted player. Exact columns follow the approved lifecycle. Generate and apply migrations in the test environment before schema-dependent tests.
- Keep authorization and pick validation server-side. A pick must check participation, captain ownership, active session/turn, tier eligibility, pool membership, existing membership, roster capacity, and agreed deadline rules. Commit the pick, roster change, and next turn atomically. Use database serialization or conditional version updates with constraints, and make retries idempotent.
- Reconcile the current membership model before coding. Starters require a starter role, substitutes have a null role, and submission requires all five distinct roles. An unassigned drafted player cannot simply be inserted as a starter with no role. Present a role-at-pick or staging-model proposal for approval.
- Apply the active-draft policy to every competing mutation, including invitation/request acceptance, leaving, captain transfer, team deletion, organizer repairs, and tier changes. These must share transactional checks so simultaneous requests cannot bypass the draft.
- Use existing authenticated loaders/actions and UI components. Recommend a synchronization approach after inspecting hosting constraints; agree on the UX and dependency tradeoff before adding infrastructure. Resync from the server after reconnects or stale requests. Client clocks and disabled buttons never determine eligibility.
- Complete the agreed handoff into lineup assignment and existing roster validation/submission. Preserve one team per registration, exactly one captain, and any retained tier/capacity rules.

Completion criterion: reviewed designs and agreed policies are implemented with atomic persistence and no regression in the retained formation flow.

## Verification and delivery

- Scheduler tests: two, three, and four teams; direction reversals; repeated endpoint turns; tier boundaries; empty tiers; capped/full teams; all teams ineligible; draft completion. Expected results must come from the agreed rules.
- Database tests: simultaneous picks for one turn/player, repeated requests, stale versions, restart/resume, and racing membership/tier edits. Exactly one valid commit should win a contested turn.
- Access tests: signed-out user, nonparticipant, ordinary participant, wrong captain, active captain, and organizer. Private draft data stays private.
- Browser checks: active pick and waiting view across two sessions, mobile/desktop, keyboard, reduced motion, network failure/reconnect, and final lineup/submission. Exercise optional mode's existing invitation flow if retained.
- Run repository lint, test, and build scripts appropriate to the changed files. Record actual results and remaining gaps, not planned checks as passed checks.
- Update this PR with final scope, approved Brilliant IDs/previews, migration instructions, and test evidence. Request feedback before further features. Merge and deployment are separate actions.

## Starting prompt for Luna

Use GPT Luna with max reasoning. Read `SNAKE_DRAFT_HANDOVER.md` and current repository instructions. Begin with the unresolved business rules and existing Brilliant references. Design the captain snake-draft flow in Brilliant MCP using the contextual guidance from design-taste-frontend and the current Rift Clash visual language. Show desktop/mobile frames and state variants for review before implementation. Carry forward the user's decisions from the originating conversation, and ask about remaining gaps. Continue on this planning PR's branch when implementation is authorized; preserve unrelated changes.
