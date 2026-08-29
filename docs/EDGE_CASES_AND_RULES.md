# Edge cases and business rules

## Tournament access

- An invalid, closed, or replaced tournament invite does not grant access.
- Closing or replacing an invite does not remove existing participants.
- Authentication without a successful tournament join does not expose participant, team, or announcement data.
- The tournament invite never grants organizer privileges.

## Player registration and tier review

- A participant may create only one registration.
- Riot name and tag are trimmed and validated, but uniqueness is not assumed because Riot naming rules may change.
- A participant may edit rank, self-assessed tier, and role preferences before the deadline.
- Changing current rank or self-assessed tier clears the approved tier and returns review status to pending.
- A pending player may create or join a draft team.
- A team containing any pending tier cannot be submitted.
- An organizer tier change immediately revalidates the player's team.
- If a tier change invalidates a submitted roster, the team returns to draft and the captain receives an in-app notice.

## Team membership

- A player may belong to only one team.
- Creating a team makes the creator its captain and first member.
- A draft roster may contain at most seven players.
- Accepting an invitation or join request rechecks membership and capacity in the same transaction.
- When a player joins a team, their other pending invitations and join requests are revoked.
- A captain cannot leave while other members remain. They must transfer captaincy first.
- A captain who is the only member may delete the draft team.
- Deleting a draft team releases all members and revokes pending invitations and requests.
- A member departure makes any submitted team a draft again.
- Participant membership changes are not allowed after the deadline.

## Lineup and submission

A valid submission requires:

- Exactly five starters.
- No more than two substitutes.
- One player in each starter slot.
- Approved tiers for all starters and substitutes.
- No more than one T1 player across the full roster.
- No more than two T2 players across the full roster.

There is no cap on T3 or T4.

Primary and secondary role preferences are advisory. A missing preference match or an unusual role assignment creates a warning, not a validation failure.

Submission validation runs against current database values in a transaction. A stale browser state cannot bypass tier, capacity, membership, or deadline rules.

A submitted team is read-only for participants. The organizer may unlock it, which returns it to draft. Any organizer repair that leaves the roster invalid also returns it to draft.

## Deadline

- The deadline is stored as an absolute timestamp and displayed in the viewer's local time with the tournament time zone or offset made clear.
- At the deadline, participants cannot create or edit registrations, create or alter teams, resolve invites or requests, or submit teams.
- The organizer may continue to review tiers, repair teams, and update settings.
- Extending the deadline re-enables eligible participant actions when the new timestamp is in the future.
- Moving the deadline into the past closes participant actions immediately.
- Existing submitted teams remain submitted unless another rule invalidates them.

## Invitations and requests

- Only a captain may invite a participant to a team.
- Only an unteamed registered participant may request to join.
- A duplicate pending invitation or request is rejected.
- Invitations and requests for submitted or deleted teams cannot be accepted.
- A declined or revoked item remains historical but cannot be reused.
- Team invitations are separate from the private tournament invite.

## Organizer repairs

- Organizer repairs still enforce one team per player and the seven-player maximum.
- The organizer cannot mark an invalid roster as submitted.
- Tier caps are not individually overridable in the MVP.
- Sensitive actions record normal timestamps and responsible user references; a separate long-term audit system is out of scope.

## Account and data integrity

- Deleting a team must not delete user or registration records.
- Password reset tokens and tournament invite codes are stored as hashes.
- User deletion and long-term privacy workflows are not participant-facing MVP features. Operational deletion must avoid orphaned team memberships and organizer ownership.
