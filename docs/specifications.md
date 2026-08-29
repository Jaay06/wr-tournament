# Wild Rift friends tournament specifications

## Product goal

Build a private, lightweight web app where a group of friends can register for one Wild Rift tournament, agree on player tiers, form balanced teams, and submit their rosters. Match scheduling, brackets, live scores, and results remain in Discord or an external bracket tool.

## Product boundary

The MVP supports one tournament at a time. It is invite-only and has no public tournament pages, searchable player profiles, league management, or multi-tournament administration.

## Roles

### Participant

A participant may:

- Join the tournament with its private invite.
- Complete and edit a player registration before the deadline.
- See other participants, approved tiers, role preferences, teams, and announcements.
- Create or join one team.
- Send team join requests and respond to team invitations.
- Leave a draft team.
- Submit a team when acting as its captain.

### Organizer

The organizer has all participant capabilities and may also:

- Configure the tournament name, region, and registration deadline.
- Close or replace the tournament invite.
- Approve or adjust player tiers.
- Inspect and repair team rosters.
- Unlock a submitted team.
- Post and manage announcements.

There is one organizer role. The MVP has no Admin or Super Admin hierarchy.

## Access and authentication

Participants sign in with Discord or an email address and password. Email verification is not required. Email is used only for password recovery.

Signing in does not grant tournament access. A signed-in user must also enter the current private tournament invite link or code. The organizer may close or replace that invite.

## Player registration

A registration records:

- Riot name and tag.
- Current Wild Rift rank.
- Self-assessed tier.
- Organizer-approved tier.
- Primary and secondary role preferences.

The tournament uses four tiers:

| Tier | Default rank range |
|---|---|
| T1 | Sovereign through Challenger |
| T2 | Grandmaster through Master |
| T3 | Diamond |
| T4 | Emerald and below |

The organizer may adjust a player's tier. A participant may form or join a draft team while approval is pending, but that team cannot be submitted until every member has an approved tier.

## Teams

A participant may belong to only one team. The participant who creates a team becomes its captain.

Captains may:

- Invite registered friends.
- Accept or decline join requests.
- Assign members as starters or substitutes.
- Arrange five starter slots.
- Submit a valid roster before the deadline.

A submitted roster must have:

- Exactly five starters.
- Zero, one, or two substitutes.
- An approved tier for every member.
- No more than one T1 player across the full roster.
- No more than two T2 players across the full roster.

There is no cap on T3 or T4 players.

Starter slots display Baron, Jungle, Mid, Dragon, and Support. Missing or duplicated role preferences produce a warning but do not block submission.

Submitting freezes the roster for participants. The organizer may unlock it or make a repair. Any change that makes a roster incomplete or invalid returns it to draft.

## Deadline

Before the registration deadline, participants may edit registrations and draft rosters. At the deadline:

- New player registrations close.
- Participant registration edits close.
- Participant roster changes and team submissions close.
- Submitted teams remain visible.
- The organizer retains override access.

The organizer may extend the deadline. Participant editing resumes only when the new deadline is in the future and the affected item is not otherwise locked.

## Visibility and communication

Tournament access is private. Any signed-in participant who has joined the tournament may see:

- Registered participants.
- Approved tiers and role preferences.
- Teams, members, and submission state.
- Tournament announcements.

The app provides a simple announcement feed and in-app status notices. General conversation and match coordination happen in Discord. Email is used only for password reset.

## Out of scope for the MVP

- Multiple tournaments, seasons, or leagues.
- Public pages or public player profiles.
- Match scheduling, brackets, scores, standings, or results.
- Waitlists, player drafts, or automated team balancing.
- Rank screenshots, evidence uploads, smurf detection, appeals, or automated moderation.
- Team branding and logo uploads.
- Data exports and reporting suites.
- Scheduled, translated, or multi-channel announcements.
- Complex audit retention and account-deletion workflows.
- Multiple organizer permission levels.
