# Environment variables

Create a local environment file from the project's example file. Never commit real credentials.

## Required

    # Neon PostgreSQL
    DATABASE_URL=postgresql://user:password@your-neon-host/neondb?sslmode=require

    # Application and authentication
    APP_URL=http://localhost:3000
    AUTH_SECRET=replace-with-a-long-random-secret

    # Discord OAuth
    DISCORD_CLIENT_ID=replace-with-discord-client-id
    DISCORD_CLIENT_SECRET=replace-with-discord-client-secret

    # Initial organizer
    ORGANIZER_EMAIL=organizer@example.com

## Password-reset email

These values are required in production because email is used for password reset. Choose one supported mail transport during implementation and document its exact variables in the example file.

    SMTP_HOST=
    SMTP_PORT=
    SMTP_USER=
    SMTP_PASSWORD=
    EMAIL_FROM=

Local development may use a protected console transport for reset links when SMTP is absent. Production must fail closed rather than logging reset links.

## Optional operational settings

    PASSWORD_RESET_TOKEN_TTL_MINUTES=30

## Rules

- DATABASE_URL must point to the intended PostgreSQL database.
- AUTH_SECRET must be a long, randomly generated production secret.
- APP_URL must match the deployed origin used by authentication callbacks and reset links.
- Discord callback URLs must be configured for local and deployed origins in the Discord developer settings.
- ORGANIZER_EMAIL identifies the account promoted during controlled setup; it does not create a public organizer-registration path.
- Secrets must remain server-only and must not use a public environment-variable prefix.
- The tournament invite code belongs in the database as a hash, not in an environment variable.
- Register the `ORGANIZER_EMAIL` account first, then run `pnpm db:setup` to initialize the singleton tournament and promote that account. The command prompts for the invite code instead of reading it from an environment variable.
