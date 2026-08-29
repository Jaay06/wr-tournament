# API and server-action contract

The app may implement these operations as Next.js server actions or route handlers. The contract describes required behavior rather than forcing a transport choice.

Every mutation must validate authentication, tournament access, authorization, the registration deadline, and the current database state on the server.

## Authentication

| Operation | Access | Purpose |
|---|---|---|
| Register with email and password | Public | Create a credentials account |
| Sign in with email and password | Public | Start a session |
| Sign in with Discord | Public | Start or create a Discord-linked session |
| Request password reset | Public | Send a one-time reset link when an eligible account exists |
| Reset password | Public with valid token | Replace a credentials password |
| Sign out | Signed-in user | End the session |

Password-reset requests return the same response whether or not an account exists.

## Tournament access

| Operation | Access | Purpose |
|---|---|---|
| Get tournament summary | Signed-in user | Return name, region, deadline, and whether the user has joined |
| Join tournament | Signed-in user with invite | Validate the private invite and create tournament participation |
| Get participant directory | Participant | List registrations, approved tiers, and role preferences |

The raw invite code must never be returned after submission.

## Player registration

| Operation | Access | Purpose |
|---|---|---|
| Get own registration | Participant | Return the current user's registration and tier status |
| Create registration | Participant before deadline | Save Riot ID, rank, self tier, and role preferences |
| Update registration | Participant before deadline | Edit registration; rank or self-tier changes reopen tier review |

Registration mutations must reject duplicate registration and edits after the deadline.

## Teams

| Operation | Access | Purpose |
|---|---|---|
| List teams | Participant | Return teams, rosters, and submission state |
| Get team | Participant | Return one team and its full roster |
| Create team | Registered participant before deadline | Create a draft team and make the creator captain |
| Rename team | Captain before deadline | Change a draft team's name |
| Delete team | Captain before deadline | Delete a draft team and release its members |
| Invite participant | Captain before deadline | Create a targeted team invitation |
| Accept or decline invite | Invited participant before deadline | Resolve an invitation |
| Request to join | Unteamed registered participant before deadline | Ask a draft team's captain to join |
| Accept or decline request | Captain before deadline | Resolve a join request |
| Leave team | Team member before deadline | Leave a draft team subject to captain rules |
| Update lineup | Captain before deadline | Assign starters, substitutes, and starter roles |
| Submit team | Captain before deadline | Validate and freeze the roster |

Invite and request acceptance must fail safely if the player has joined another team or the roster has reached seven members.

Submission requires exactly five starters, no more than two substitutes, approved tiers for all members, no more than one T1 player, and no more than two T2 players. Role preference mismatches return warnings but do not fail submission.

## Announcements and notifications

| Operation | Access | Purpose |
|---|---|---|
| List announcements | Participant | Return the tournament announcement feed |
| List notifications | Signed-in user | Return the user's in-app notices |
| Mark notification read | Notification owner | Mark one notice as read |
| Mark all notifications read | Signed-in user | Clear the unread state |

## Organizer operations

| Operation | Access | Purpose |
|---|---|---|
| Update tournament settings | Organizer | Change name, region, or deadline |
| Replace tournament invite | Organizer | Invalidate the old code and issue a new one |
| Close or reopen tournament invite | Organizer | Control whether new friends may join |
| List tier-review queue | Organizer | Return pending player registrations |
| Approve or adjust tier | Organizer | Set the approved tier and notify the player |
| Edit a team | Organizer | Repair membership or lineup |
| Unlock a submitted team | Organizer | Return the team to draft |
| Create announcement | Organizer | Add an announcement |
| Update announcement | Organizer | Edit an announcement |
| Delete announcement | Organizer | Remove an announcement |

Organizer changes that affect a submitted roster must revalidate the team. An invalid submitted team returns to draft and its captain receives an in-app notice.

## Error shape

Expected failures should return a stable application code and a user-safe message. Useful codes include:

- UNAUTHENTICATED
- TOURNAMENT_ACCESS_REQUIRED
- FORBIDDEN
- DEADLINE_PASSED
- INVITE_INVALID
- INVITE_CLOSED
- REGISTRATION_REQUIRED
- TIER_APPROVAL_REQUIRED
- ALREADY_ON_TEAM
- TEAM_FULL
- NOT_TEAM_CAPTAIN
- ROSTER_INVALID
- CONFLICT

Validation errors should identify fields without exposing database or authentication internals.
