# API Endpoints

Use Next.js API routes (or server actions) under `/app/api`. All endpoints return JSON.

## Authentication

- `GET /api/auth/[...nextauth]` – NextAuth handler.
- `POST /api/auth/register` – register with email/password (if not using built-in credentials provider).
  - Body: `{ email, password, username }`
  - Response: user object or error.

## Player Endpoints

- `POST /api/players` – create player profile (requires auth).
  - Body: `{ summoner_name, region, current_rank, self_assessed_tier }`
  - Response: player object with `tier_status: 'pending'`.
- `GET /api/players/me` – get current user's player profile.
- `PUT /api/players/me` – update own profile (before deadline).
  - Body: any of `{ summoner_name, region, current_rank, self_assessed_tier }`
  - Only allowed if tier not yet approved? (Or always, but triggers re-review if self_assessed_tier changes).

## Team Endpoints

- `POST /api/teams` – create a team.
  - Body: `{ name, logo_url? }`
  - Validates: user is not already in a team; team name unique.
  - Returns team object with invite code.
- `GET /api/teams` – list all teams (for browsing). Optional query `?open=true` to filter teams with available slots.
- `GET /api/teams/:teamId` – get team details with members.
- `POST /api/teams/:teamId/invite` – generate a new invite code/link.
  - Returns `{ invite_code }`.
- `POST /api/teams/:teamId/join-by-code` – join team using invite code.
  - Body: `{ invite_code }`
- `POST /api/teams/:teamId/request` – request to join a team (if team is open).
- `POST /api/teams/:teamId/leave` – leave team (if before deadline and user is member).
- `DELETE /api/teams/:teamId` – delete team (if user is creator and no other members, or admin).

## Admin Endpoints (require admin role)

- `GET /api/admin/players` – list all players with tier status.
- `PUT /api/admin/players/:playerId/tier` – set assigned_tier and tier_status.
  - Body: `{ assigned_tier: 'T1'|'T2'|'T3'|'T4', tier_status: 'approved'|'rejected' }`
- `PUT /api/admin/players/:playerId/team` – move player to another team (or remove).
  - Body: `{ team_id: string | null }`
- `GET /api/admin/teams` – list all teams with members.
- `PUT /api/admin/teams/:teamId` – edit team (name, logo, add/remove players, override warnings).
- `POST /api/admin/announcements` – create announcement.
- `GET /api/admin/export` – export players/teams CSV.

## Settings Endpoints (Super Admin only)

- `GET /api/admin/settings` – get tournament settings.
- `PUT /api/admin/settings` – update settings.
  - Body: `{ max_team_size, min_team_size, max_t1_per_team, max_t2_per_team, registration_deadline, tier_definitions }`

## Validation

- All endpoints validate input and enforce business rules (team composition, deadline).
- Responses include meaningful error messages.
