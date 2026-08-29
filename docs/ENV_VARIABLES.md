# Environment Variables

Copy `.env.example` to `.env` and fill in the following:

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wildrift_tournament?schema=public

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Optional: SMTP for email (if using email verification)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
```

## Notes

- `DATABASE_URL` must be a valid PostgreSQL connection string.
- `NEXTAUTH_SECRET` should be a long random string; generate with `openssl rand -base64 32`.
- Discord OAuth credentials are obtained from Discord Developer Portal.
