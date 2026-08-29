# Authentication Setup

## NextAuth Configuration

We use NextAuth (Auth.js) with two providers:

1. **Discord OAuth**
2. **Credentials (email/password)**

## Environment Variables

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DATABASE_URL` (used by Drizzle adapter if using database sessions)

## Discord Provider Setup

1. Create a Discord Application at https://discord.com/developers/applications.
2. Add OAuth2 redirect URL: `http://localhost:3000/api/auth/callback/discord` (and production equivalent).
3. Copy Client ID and Secret into `.env`.
4. In NextAuth providers array:
   ```ts
   DiscordProvider({
     clientId: process.env.DISCORD_CLIENT_ID,
     clientSecret: process.env.DISCORD_CLIENT_SECRET,
   });
   ```

## Credentials Provider

Use the `CredentialsProvider` with email/password.

- Store password hash (bcrypt) in `users.password_hash`.
- On login, verify and return user object.
- On registration, create a user with a unique username and email.

## User Role Assignment

- Add `role` column to `users` (e.g., 'player', 'admin', 'super_admin') or use a separate `user_roles` table.
- Default role is 'player'.
- Admins are manually set in database or via environment variable during initial setup.

## Session Strategy

- Use JWT sessions for simplicity. Include `user.id` and `role` in token.
- Ensure admin routes check token role.

## Protecting Routes

- Middleware or per-page checks: if not authenticated, redirect to login.
- Admin pages require `role === 'admin'` or `'super_admin'`.
