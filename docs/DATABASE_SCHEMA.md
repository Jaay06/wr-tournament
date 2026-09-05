# Database schema

The implemented schema is `db/schema.ts`; committed SQL migrations live in `drizzle/`. Migration files establish the schema history, not whether a particular environment has applied it.

The MVP stores one active tournament. Tournament-specific tables therefore do not carry a tournament identifier. Supporting multiple tournaments later will require an explicit migration.

## Enumerations

- Account role: user, organizer
- Tier: T1, T2, T3, T4
- Tier status: pending, approved
- Wild Rift role: Baron, Jungle, Mid, Dragon, Support
- Team status: draft, submitted
- Lineup position: starter, substitute
- Request status: pending, accepted, declined, revoked
- Notification status: unread, read

## Tables

### users

| Column | Notes |
|---|---|
| id | Primary key |
| email | Unique and nullable for Discord-only accounts |
| discord_id | Unique and nullable for credentials-only accounts |
| password_hash | Nullable; never stores a plain-text password |
| display_name | Name shown inside the tournament |
| avatar_url | Optional Discord or account avatar |
| role | user or organizer |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

A user must have either an email address or a Discord identity.

### tournament_settings

A singleton row containing the active tournament configuration.

| Column | Notes |
|---|---|
| id | Integer primary key, default 1; database check requires id = 1 |
| name | Tournament name |
| region | Organizer-selected Wild Rift region |
| invite_code_hash | Hash of the current private invite code |
| invite_enabled | Whether the current invite can be used |
| registration_deadline | Optional registration and team-submission deadline; null keeps registration open |
| updated_by | Organizer user reference |
| updated_at | Last update timestamp |

### tournament_participants

Records which users have joined the private tournament.

| Column | Notes |
|---|---|
| id | Primary key |
| user_id | Unique user reference |
| joined_at | Join timestamp |

Authentication alone does not create this row; a valid tournament invite does. Controlled organizer setup also creates this row for the organizer.

### player_registrations

| Column | Notes |
|---|---|
| id | Primary key |
| participant_id | Unique tournament participant reference |
| riot_name | Riot game name |
| riot_tag | Riot tag line |
| current_rank | Current Wild Rift rank |
| self_assessed_tier | T1 through T4 |
| approved_tier | Nullable until reviewed |
| tier_status | pending or approved |
| primary_role | Preferred role |
| secondary_role | Second preferred role |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

Changing current rank or self-assessed tier returns tier status to pending. A database check requires a null approved tier for pending registrations and a non-null tier for approved registrations. Another check requires different primary and secondary roles. There is no dedicated review timestamp or reviewer column; `updated_at` also changes on ordinary registration edits.

### teams

| Column | Notes |
|---|---|
| id | Primary key |
| name | Unique within the tournament |
| status | draft or submitted |
| submitted_at | Nullable submission timestamp |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

### team_members

| Column | Notes |
|---|---|
| id | Primary key |
| team_id | Team reference |
| registration_id | Unique player registration reference |
| is_captain | Whether this member manages the team |
| lineup_position | starter or substitute |
| starter_role | Nullable; one of the five starter slots |
| joined_at | Membership timestamp |

The unique registration reference enforces one team per player. A partial unique index permits at most one captain per team; application transactions preserve the existence of that captain. A unique index on `team_id, starter_role` prevents duplicate starter slots. A check requires a starter role for starters and a null role for substitutes. Multiple null substitute roles are allowed.

### team_invites

Invitations are addressed to an existing player registration.

| Column | Notes |
|---|---|
| id | Primary key |
| team_id | Team reference |
| invited_registration_id | Invited player registration |
| invited_by_registration_id | Captain's player registration |
| status | pending, accepted, declined, or revoked |
| created_at | Creation timestamp |
| responded_at | Nullable response timestamp |

Only one pending invite may exist for the same player and team.

### team_join_requests

| Column | Notes |
|---|---|
| id | Primary key |
| team_id | Requested team |
| registration_id | Requesting player |
| status | pending, accepted, declined, or revoked |
| created_at | Creation timestamp |
| responded_at | Nullable response timestamp |

Only one pending request may exist for the same player and team.

### announcements

| Column | Notes |
|---|---|
| id | Primary key |
| title | Short heading |
| body | Plain text |
| created_by | Organizer user reference |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

### notifications

| Column | Notes |
|---|---|
| id | Primary key |
| user_id | Recipient user reference |
| type | Application-defined event type |
| message | Short in-app message |
| status | unread or read |
| created_at | Creation timestamp |
| read_at | Nullable read timestamp |

Notifications cover direct events such as tier review, team invitations, join-request decisions, submission, and organizer unlocks. They are not sent by email.

### password_reset_tokens

| Column | Notes |
|---|---|
| id | Primary key |
| user_id | User reference |
| token_hash | Hash of the one-time reset token |
| expires_at | Expiration timestamp |
| used_at | Nullable consumption timestamp |
| created_at | Creation timestamp |

## Application invariants and transactions

- A user may join the tournament once and register once.
- A registration may belong to at most one team.
- A team must have exactly one captain.
- A submitted roster may contain no more than one T1 player and no more than two T2 players.
- Team invite acceptance and join-request acceptance must recheck team capacity and one-team membership inside a transaction.
- Team submission must validate the full roster and deadline inside a transaction.
- Tier changes, member departures, and organizer repairs must revalidate affected submitted teams.
- Invite codes and password-reset tokens are stored as hashes.
- Deleting a team cascades to its members, invites, and join requests. Other foreign keys use `restrict`.
- Seven-member capacity, exactly five starters at submission, and tier caps are application checks, not database constraints.
- UUID primary keys default to random UUIDs, except the integer singleton settings key. Timestamps use PostgreSQL timestamps with time zone.
