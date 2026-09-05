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

As of 2026-09-05, the code implements authentication and password reset, private entry, player registration and profiles, tier review, team invitations and requests, captain transfer, lineup editing and submission, organizer repairs, announcements, and notification read state. Public pages explain the app, rules, tiers, and entry flow. Tournament records remain private.

The current app design lives in Brilliant MCP, project `Scratch`, canvas `rift-clash/app-screens-redesign`. See the [UI guidelines](docs/UI_UX_GUIDELINES.md) for the design workflow. The interface uses shared Base UI components, Tailwind tokens, and Motion. See the [roadmap](docs/DEVELOPMENT_ROADMAP.md) for implementation status and remaining verification. Source review does not establish the state of a deployed database or production email delivery.

## Stack

- Next.js App Router and TypeScript.
- Tailwind CSS.
- PostgreSQL with Drizzle ORM.
- Auth.js through `next-auth` v5 beta, with Discord OAuth and credentials.
- Base UI, Lucide icons, and Motion for React.

See `package.json` and `pnpm-lock.yaml` for dependency versions.

## Local development

Requirements:

- Node.js 20.9 or newer.
- pnpm.

Install dependencies and configure the environment:

    pnpm install
    cp .env.example .env.local

The database uses Neon PostgreSQL through Drizzle. Create a Neon project, copy its connection string into `DATABASE_URL` in `.env.local`, then apply the committed migrations and start the app:

    pnpm db:migrate
    pnpm dev

Run `pnpm db:generate` only after changing `db/schema.ts`.

Create the organizer's account at `/register` using the same `ORGANIZER_EMAIL`, then initialize the one tournament and promote that account. Setup defaults to `Rift Clash` in `EU`, leaves the deadline open, generates an invite code, and prints it once:

    pnpm db:setup

Set `AUTH_SECRET` and `ORGANIZER_EMAIL` before using authentication or running `pnpm db:setup`. Discord OAuth variables are optional until Discord sign-in is enabled. See [environment variables](docs/ENV_VARIABLES.md) for the full configuration.

To deactivate an account without deleting its row or tournament history, run:

    pnpm db:soft-delete --email friend@example.com

After setup, sign out and sign in again to refresh the organizer role in the JWT session. Visit `/admin` for tier review, team oversight, announcements, and settings.

## Verification

- `pnpm test` runs the helper and validation tests in `lib/*.test.ts`.
- `pnpm lint` runs ESLint.
- `pnpm build` checks the production build.
- With the app running, `pnpm test:homepage` checks the homepage and public rules page. Set `TOURNAMENT_URL` to check another origin.
- `/ui-preview?screen=...` renders UI fixtures outside production. It returns 404 in production.

These checks do not replace authenticated database integration tests or end-to-end tournament testing.

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
