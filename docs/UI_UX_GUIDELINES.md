# UI and UX guidelines

## Experience goal

The app should feel like a private tournament room for friends: direct, lightweight, and easy to understand on a phone. It should not resemble a public esports platform or an enterprise administration tool.

Use the approved Paper design as the visual reference. These guidelines define behavior and information hierarchy rather than replacing that design.

Use Tailwind CSS utilities for component styling. Keep global CSS limited to Tailwind imports, design tokens, resets, and truly global browser rules. Do not add page-specific CSS modules for the interface.

Use semantic Tailwind color utilities rather than arbitrary color values. The app palette is defined in `app/globals.css` with `oklch(...)` tokens and consumed through classes such as `bg-background`, `bg-primary`, `bg-secondary`, `bg-card`, `text-foreground`, `text-muted-foreground`, and `border-border`.

## Visual language

- Build mobile-first and expand cleanly to desktop.
- Use clear typography, generous spacing, and a restrained number of surfaces.
- Keep tournament status and the next available action visible.
- Use tier color as an accent, never as the only way to communicate a tier.
- Pair every status color with text and, where useful, an icon.
- Keep motion short and purposeful; respect reduced-motion preferences.

Tier accents:

| Tier | Color | Required label |
|---|---|---|
| T1 | Gold, `tier-t1` token | T1 |
| T2 | Silver, `tier-t2` token | T2 |
| T3 | Bronze, `tier-t3` token | T3 |
| T4 | Grey, `tier-t4` token | T4 |

Check contrast before using these colors for text. Prefer badges with accessible foreground colors.

## Main flow

### Private entry

The private invite opens a compact tournament introduction containing:

- Tournament name and region.
- Registration deadline.
- Sign-in or create-account action.
- Invite acceptance after authentication.

Do not show a public participant directory or public team list. Preserve the invite intent through the sign-in flow so the user does not need to enter the code twice.

### Registration

Use one short form rather than a long wizard:

- Riot name.
- Riot tag.
- Current rank.
- Self-assessed tier.
- Primary role.
- Secondary role.

Explain the default tier ranges beside the tier control. After submission, show a clear Pending review state and let the participant continue to team formation.

### Participant home

The participant home prioritizes:

1. Deadline and tournament status.
2. Registration and tier-review status.
3. Current team or the actions to create and browse teams.
4. Recent announcements.
5. Direct notifications.

Avoid dashboards filled with decorative statistics.

### Team browser

Show compact team cards with:

- Team name and captain.
- Current member count.
- Approved tier totals.
- Draft or submitted state.
- Whether the draft roster has room for a join request.

A participant already on a team may browse but cannot send another join request.

### Team room

The team room is the central collaborative screen. It contains:

- Team name and submission status.
- Captain controls.
- Five named starter slots: Baron, Jungle, Mid, Dragon, and Support.
- Up to two substitute slots.
- Each member's display name, approved or pending tier, and role preferences.
- Pending invitations and join requests.
- A compact validation summary.
- The submit action for the captain.

Empty slots use clear placeholders. Pending tiers show a neutral pending badge. Duplicate or mismatched role preferences show warnings near the relevant slots but do not disable submission.

Submission-blocking issues must be listed in plain language, for example:

- Add two more starters.
- Amara's tier still needs organizer approval.
- This roster has two T1 players; the maximum is one.

After submission, participant editing controls are replaced by a locked-state message. Organizer controls remain visibly distinct.

## Organizer view

Use a simple top-level navigation:

- Overview.
- Tier review.
- Teams.
- Announcements.
- Settings.

The overview shows the deadline, participation counts, pending tier reviews, and blocked teams. Put the pending-review queue ahead of secondary information.

Tier review should support one-player-at-a-time approval without a complex moderation case interface. Team oversight uses the same team room as participants, with clearly labelled organizer actions for unlock and repair.

## Feedback and safeguards

- Confirm destructive actions such as deleting a draft team or replacing the tournament invite.
- Do not use a confirmation modal for routine reversible actions.
- Show server validation beside the control that caused it.
- Keep disabled-button explanations visible.
- Announce asynchronous success and error messages to assistive technology.
- Preserve form input after recoverable errors.
- Use keyboard-accessible dialogs, menus, and controls.
- Provide a reduced-motion variant for every nonessential transition.

## Responsive behavior

- On small screens, stack starter slots vertically and keep the submit action reachable.
- On wider screens, display starter slots as a five-column lineup when space permits.
- Tables in the organizer view should become cards or horizontally scroll with clear headers.
- Never require hover to reveal an action or explanation.
