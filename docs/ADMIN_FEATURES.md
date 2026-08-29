# Admin Features

## Overview

Admins can manage players, teams, and tournament settings. Super Admins have additional settings access.

## Tier Review

- **Queue**: A list of players with `tier_status = 'pending'`.
- For each player, display: Summoner Name, Rank, Self‑Assessed Tier, and optionally stats.
- Actions:
  - **Approve**: Set `assigned_tier` = self_assessed, `tier_status = 'approved'`.
  - **Override**: Choose a different tier from dropdown, then approve.
- Bulk actions: select multiple players and approve with their self‑assessed tier.

## Team Management

- List all teams with member count, validity status (based on rules).
- Clicking a team shows details and allows:
  - Manually add/remove players (drag‑and‑drop optional).
  - Override rule violations with a warning modal (reason optional, logged in `admin_actions_log`).
- Ability to delete a team (if no players or after warning).

## Announcements

- Create announcements with title and body.
- They appear on player dashboard and landing page.
- Can be edited or deleted.

## Settings (Super Admin)

- **Team Size**: min and max (default 5–7).
- **Tier Rules**: max T1 per team (default 1), max T2 per team (default 2).
- **Registration Deadline**: date/time picker. Once passed, lock player actions.
- **Tier Definitions**: map ranks to tiers (e.g., T1 = Sovereign–Challenger). Stored as JSON.

## Export

- Export player list to CSV with columns: Username, Summoner Name, Region, Rank, Self Tier, Assigned Tier, Team.
- Export team list with members and validity.

## Audit Log

- Log admin actions that override rules or change tiers/teams.
- Viewable by super admins (optional).
