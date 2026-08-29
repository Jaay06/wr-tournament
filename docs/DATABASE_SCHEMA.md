# Database Schema

PostgreSQL with Drizzle ORM. All tables have `id` as UUID primary key (default gen_random_uuid()).

## Tables

### users

| Column        | Type      | Constraints                   |
| ------------- | --------- | ----------------------------- |
| id            | uuid      | primary key                   |
| email         | varchar   | unique, nullable              |
| discord_id    | varchar   | unique, nullable              |
| password_hash | varchar   | nullable (for email/password) |
| username      | varchar   | unique, not null              |
| avatar_url    | varchar   | nullable                      |
| created_at    | timestamp | not null, default now()       |

### players

| Column             | Type      | Constraints                       |
| ------------------ | --------- | --------------------------------- |
| id                 | uuid      | primary key                       |
| user_id            | uuid      | foreign key -> users.id, unique   |
| summoner_name      | varchar   | not null                          |
| region             | varchar   | not null                          |
| current_rank       | varchar   | not null (enum rank values)       |
| self_assessed_tier | varchar   | not null (T1,T2,T3,T4)            |
| assigned_tier      | varchar   | nullable, set by admin            |
| tier_status        | varchar   | not null default 'pending'        |
| team_id            | uuid      | foreign key -> teams.id, nullable |
| created_at         | timestamp | not null default now()            |
| updated_at         | timestamp | not null default now()            |

### teams

| Column     | Type      | Constraints             |
| ---------- | --------- | ----------------------- |
| id         | uuid      | primary key             |
| name       | varchar   | unique, not null        |
| logo_url   | varchar   | nullable                |
| created_by | uuid      | foreign key -> users.id |
| locked     | boolean   | not null default false  |
| created_at | timestamp | not null default now()  |
| updated_at | timestamp | not null default now()  |

### team_invites

| Column      | Type      | Constraints             |
| ----------- | --------- | ----------------------- |
| id          | uuid      | primary key             |
| team_id     | uuid      | foreign key -> teams.id |
| invite_code | varchar   | unique, not null        |
| created_by  | uuid      | foreign key -> users.id |
| expires_at  | timestamp | nullable                |
| used        | boolean   | not null default false  |
| created_at  | timestamp | not null default now()  |

### team_join_requests

| Column     | Type      | Constraints                |
| ---------- | --------- | -------------------------- |
| id         | uuid      | primary key                |
| team_id    | uuid      | foreign key -> teams.id    |
| player_id  | uuid      | foreign key -> players.id  |
| status     | varchar   | not null default 'pending' |
| created_at | timestamp | not null default now()     |

### announcements

| Column     | Type      | Constraints             |
| ---------- | --------- | ----------------------- |
| id         | uuid      | primary key             |
| title      | varchar   | not null                |
| body       | text      | not null                |
| created_by | uuid      | foreign key -> users.id |
| created_at | timestamp | not null default now()  |

### tournament_settings (single row)

| Column                | Type      | Constraints                   |
| --------------------- | --------- | ----------------------------- |
| id                    | smallint  | primary key default 1         |
| max_team_size         | int       | not null default 7            |
| min_team_size         | int       | not null default 5            |
| max_t1_per_team       | int       | not null default 1            |
| max_t2_per_team       | int       | not null default 2            |
| registration_deadline | timestamp | nullable                      |
| tier_definitions      | jsonb     | not null (maps tier to ranks) |
| updated_by            | uuid      | foreign key -> users.id       |
| updated_at            | timestamp | not null default now()        |

### admin_actions_log

| Column      | Type      | Constraints             |
| ----------- | --------- | ----------------------- |
| id          | uuid      | primary key             |
| admin_id    | uuid      | foreign key -> users.id |
| action_type | varchar   | not null                |
| details     | jsonb     | not null                |
| created_at  | timestamp | not null default now()  |

## Relationships

- User 1‑to‑1 Player (a user has exactly one player profile).
- Player belongs to exactly one Team (nullable).
- Team has many Players (via `team_id` on players).
- Team has many TeamInvites, TeamJoinRequests.
- Admin actions are logged in admin_actions_log.

## Indexes

- Unique index on players.user_id.
- Index on players.team_id.
- Index on teams.name.
- Index on team_invites.invite_code.
