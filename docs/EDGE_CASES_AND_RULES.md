# Edge Cases and Additional Rules

This document clarifies ambiguous scenarios and business rules.

## Tier Changes

- If a player's assigned tier is changed after they have joined a team, the system should re-validate the team composition.
- If the team becomes invalid (e.g., now has 2 T1 players), the team is flagged as `invalid` and an admin must resolve by either moving a player or overriding the rule.
- Players can change their self‑assessed tier up until an admin approves it. After approval, only admins can change the assigned tier.

## Team Creation & Joining

- A player can only be a member of **one** team at a time.
- A player cannot create a team if they are already in a team.
- Team names must be unique and cannot be changed after the deadline (admins can still change).
- Team creator is automatically a member and counts toward team size.
- Leaving a team is only allowed before the registration deadline. After deadline, only admins can remove a player.
- Invite codes can be used multiple times until they are revoked or expired (if expiration is set).

## Deadline Enforcement

- The `registration_deadline` is a timestamp set by Super Admin.
- After the deadline:
  - Players cannot create teams, join teams, leave teams, or change their profile/tier.
  - Admins can still edit players, teams, and settings.
- If the deadline is extended, player actions are re-enabled.

## Admin Override

- When an admin tries to add a player to a team that would violate composition rules, show a warning modal: “This will exceed the allowed number of T1/T2 players. Override?” The admin must confirm.
- All overrides are logged in `admin_actions_log` with details (who, when, what change).
- Overrides do not change the global rules; they just allow a specific team to violate them.

## Team Size

- A team with fewer than `min_team_size` players is considered incomplete and cannot participate in the tournament (admin can still manually include).
- A team can have up to `max_team_size` players. Adding beyond that is blocked.

## Data Integrity

- Deleting a user cascades to delete their player profile, team membership, invites, etc. (or use soft delete if needed).
- If a team is deleted, all its members' `team_id` is set to null.
