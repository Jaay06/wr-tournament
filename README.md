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

The responsive private-entry homepage follows the Paper design language and the confirmed product scope. Neon and Drizzle are connected, the schema migration is applied, and the first authentication and private-entry slice is implemented. Password reset, organizer invite controls, and player registration are next.

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
    cp .env.example .env.local
    pnpm dev

The database uses Neon PostgreSQL through Drizzle. Create a Neon project, copy its connection string into `DATABASE_URL` in `.env.local`, then generate and apply the first migration:

    pnpm db:generate
    pnpm db:migrate

Create the organizer's account at `/register` using the same `ORGANIZER_EMAIL`, then initialize the one tournament and promote that account. The command prompts for the invite code and stores only its hash:

    pnpm db:setup

Set `AUTH_SECRET` and `ORGANIZER_EMAIL` before using authentication or running `pnpm db:setup`. Discord OAuth variables are optional until Discord sign-in is enabled. See [environment variables](docs/ENV_VARIABLES.md) for the full configuration.

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
