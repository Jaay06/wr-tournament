# Environment variables

Create a local environment file from the project's example file. Never commit real credentials.

## Required

    # Neon PostgreSQL
    DATABASE_URL=postgresql://user:password@your-neon-host/neondb?sslmode=require

    # Application and authentication
    APP_URL=http://localhost:3000
    AUTH_SECRET=replace-with-a-long-random-secret

    # Initial organizer
    ORGANIZER_EMAIL=organizer@example.com

## Optional Discord OAuth

    DISCORD_CLIENT_ID=
    DISCORD_CLIENT_SECRET=

Discord sign-in appears only when both values are present. Leave them empty to use credentials only; replace the example file's placeholder values before enabling Discord. Register `/api/auth/callback/discord` under each application origin in Discord developer settings.

## Password-reset email

Nodemailer uses the following SMTP configuration. All five values are required to enable delivery. Port 465 uses implicit TLS; other ports use the transport's normal SMTP negotiation.

    SMTP_HOST=
    SMTP_PORT=
    SMTP_USER=
    SMTP_PASSWORD=
    EMAIL_FROM=

Only `NODE_ENV=development` permits console reset links when SMTP is absent or incomplete. Outside development, missing SMTP disables delivery and the request still returns its neutral response. Production does not log tokens. Verify real email delivery before launch.

## Optional operational settings

    PASSWORD_RESET_TOKEN_TTL_MINUTES=30

`APP_URL` supplies metadata URLs and password-reset links. Production reset links require HTTPS. `NEXT_DEPLOYMENT_ID` optionally identifies the build; `next.config.ts` otherwise uses the first 32 characters of `VERCEL_GIT_COMMIT_SHA`, then `local`. `TOURNAMENT_URL` overrides the origin used by `pnpm test:homepage`.

## Rules

- DATABASE_URL must point to the intended PostgreSQL database.
- AUTH_SECRET must be a long, randomly generated production secret.
- APP_URL must match the deployed origin. Auth.js callback origin configuration must agree with it.
- Discord callback URLs must be configured for local and deployed origins in the Discord developer settings.
- ORGANIZER_EMAIL identifies the account promoted during controlled setup; it does not create a public organizer-registration path.
- Secrets must remain server-only and must not use a public environment-variable prefix.
- The tournament invite code belongs in the database as a hash, not in an environment variable.
- Register the `ORGANIZER_EMAIL` account first, then run `pnpm db:setup` to initialize the singleton tournament and promote that account. Setup defaults to `Rift Clash` in `EU`, leaves the deadline open, and prints a four-digit invite code once. Sign in again after promotion to refresh the session role.
- `pnpm db:setup --name "Tournament name" --region EU` customizes setup. On an existing tournament, `--replace-invite` replaces the code, reopens entry, and updates name and region while preserving the deadline. Supply the intended name and region to avoid resetting them to defaults.
