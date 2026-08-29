# Specifications

## Overview

The Wild Rift Tournament Web App facilitates player registration, tier assignment (reviewed by admins), team formation with composition rules, and tournament deadline enforcement.

## User Roles

### Player

- Register using Discord OAuth or email/password.
- Create a player profile with Summoner Name, Region, Current Rank, and Self‑Assessed Tier.
- Join or create a team (subject to tier rules).
- View team composition and tournament announcements.

### Admin

- Review player tiers (approve or override self‑assessment).
- Move players between teams.
- Override team composition rules with warning.
- Post announcements.
- Export data to CSV.

### Super Admin

- All admin capabilities.
- Manage other admins (optional).
- Edit tournament settings: tier definitions, team composition rules, registration deadline.

## Tier Definitions

- **T1** = Sovereign – Challenger
- **T2** = Grandmaster – Master
- **T3** = Diamond
- **T4** = Emerald and below

## Team Composition Rules

- Team size: **5–7 players** (adjustable by Super Admin).
- Max **1 T1** player per team.
- Max **2 T2** players per team.
- No limit on T3 or T4 players (within team size).
- Violations are blocked during normal team join/creation, but admins can override with a warning.

## Registration Flow

1. Player signs up (Discord OAuth or email/password).
2. Completes profile: Summoner Name, Region, Current Rank, Self‑Assessed Tier.
3. Tier is marked `pending` until an admin reviews.
4. Player can create a team or join an existing team via invite link/code or request to join an open team.
5. Team composition is validated automatically.
6. After registration deadline, no player can create/join/leave a team or change tier (admins can still edit).

## Invite System

- Team creator can generate an invite link or code.
- Invited players can accept or decline the invite.
- Invites can be revoked by the team creator and may have an expiration (optional).

## Deadline Enforcement

- Super Admin sets a registration/team lock deadline.
- After deadline, player actions (create team, join team, leave team, change tier) are disabled.
- Admin overrides remain available.
- Deadline can be extended by Super Admin.

## Edge Cases

- If a player’s tier is changed after joining a team and the team becomes invalid, the team is flagged; admin must resolve (override or move player).
- A player can only be in one team at a time.
- A team can have fewer than 5 players before deadline but is marked as incomplete.
