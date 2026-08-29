# Wild Rift friends tournament

A private web app for one group of friends to register for a Wild Rift tournament, confirm player tiers, form teams, and submit valid rosters. Match coordination and brackets stay in Discord or an external bracket tool.

## Confirmed MVP

- Private tournament invite.
- Discord or email-and-password sign-in.
- Riot ID, rank, tier, and role registration.
- Organizer tier approval.
- Captain-led teams with five starters and up to two substitutes.
- Full-roster caps of one T1 and two T2 players.
- Team submission and deadline enforcement.
- Simple in-app announcements and direct notices.

The MVP does not include public profiles, multiple tournaments, brackets, results, exports, evidence uploads, or advanced moderation.

## Current state

The Next.js, TypeScript, and Tailwind CSS scaffold exists. The responsive private-entry homepage now follows the Paper design language and the confirmed product scope. Product rules and implementation contracts are documented. Database, authentication, and tournament features have not yet been implemented.

## Planned stack

- Next.js App Router and TypeScript.
- Tailwind CSS.
- PostgreSQL with Drizzle ORM.
- Auth.js or NextAuth with Discord OAuth and credentials.

## Local development

Requirements:

- Node.js 20.9 or newer.
- pnpm.

Install and run the current scaffold:

    pnpm install
    pnpm dev

Database and authentication environment variables will become required as their roadmap phases are implemented. See [environment variables](docs/ENV_VARIABLES.md) for the planned configuration.

## Documentation

- [Domain glossary](CONTEXT.md)
- [Product specifications](docs/specifications.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [API and server-action contract](docs/API_ENDPOINTS.md)
- [Authentication and private access](docs/AUTHENTICATION.md)
- [Organizer features](docs/ADMIN_FEATURES.md)
- [UI and UX guidelines](docs/UI_UX_GUIDELINES.md)
- [Edge cases and business rules](docs/EDGE_CASES_AND_RULES.md)
- [Environment variables](docs/ENV_VARIABLES.md)
- [Development roadmap](docs/DEVELOPMENT_ROADMAP.md)
