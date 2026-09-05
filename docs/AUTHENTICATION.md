# Authentication and private access

## Supported sign-in methods

The MVP supports:

- Discord OAuth.
- Email and password.

Email verification is not required. Email delivery is used only for password reset.

## Account rules

- Email addresses are normalized and unique when present.
- Discord identities are unique.
- Passwords are hashed with Node.js scrypt and a random salt and never logged or stored in plain text.
- Account linking and adding credentials to a Discord-only account are not implemented. Any future linking flow must authenticate ownership first.
- Accounts are not linked automatically only because a Discord email matches an existing credentials email.
- Sign-in responses must not reveal whether an email address exists.
- Password-reset requests use process-local rate limits: 20 per client IP per hour and 3 per email per 15 minutes. Sign-in, account registration, and tournament invite checks have no application rate limiter. Shared rate limiting across instances remains deployment work.

## Sessions

`auth.ts` configures Auth.js JWT sessions and its session cookies. There are no database session or OAuth account tables. Production cookies must use secure transport and an appropriate same-site policy.

The session exposes only the identity and role needed by the app:

- User identifier and email.
- Display name and avatar when available.
- user or organizer account role.
- Whether the user has joined the tournament.

Identity and role are cached in the JWT. Signing out and back in refreshes a role changed through setup. Password reset does not revoke existing JWT sessions. Tournament routes check participation in the database.

Server-side authorization remains authoritative. Hiding a control in the interface is not access control.

## Tournament invite

Authentication and tournament access are separate.

Invite codes contain four digits. The generator chooses 1000 through 9999; the validator accepts any four-digit string. Codes are hashed with SHA-256 and compared with a timing-safe comparison.

`/invite?code=...` preserves the code in a validated local callback through sign-in, Discord OAuth, and account creation. Sign-in and registration may show recognized, invalid, or closed invite status before authentication. They do not disclose tournament settings or participant records. The authenticated join operation rechecks the code.

After signing in, a user who has not joined the tournament must enter the active private invite link or code. The server hashes the submitted code and compares it with the stored hash. A successful join creates a tournament participant record.

The organizer may:

- Close the invite without removing existing participants.
- Reopen the current invite.
- Generate a new random invite code, immediately invalidating the old code.

The raw code is shown to the organizer once after generation. Only its hash is stored in the database.

The invite grants participant access only. It never grants organizer privileges.

## Organizer assignment

The MVP has one organizer role and no role-management screen. The initial organizer is assigned through a controlled deployment or database setup step using the configured organizer email. Setup also grants that account tournament participation, so the organizer does not need an invite. Changing the organizer is an operational task, not a participant-facing feature.

## Password reset

A credentials user may request a one-time password-reset link.

- The stored token is hashed.
- Tokens contain 32 random bytes, encoded as 64 hex characters; only a SHA-256 hash is stored.
- The default lifetime is 30 minutes, configurable with `PASSWORD_RESET_TOKEN_TTL_MINUTES`.
- Requesting a new token deletes earlier unused tokens.
- The token is invalid after first use.
- A successful reset invalidates any other outstanding reset tokens for the user.
- The request endpoint returns a neutral response even when no account matches.
- Discord-only accounts receive no password-reset email unless credentials have been added.

In local development, the reset link may be logged to a protected development console when email delivery is not configured. It must never be logged in production.

## Route protection

- Public: `/`, `/how-it-works`, `/rules`, `/tiers`, `/signin`, `/register`, `/api/auth/[...nextauth]`, `/forgot-password`, and `/reset-password`.
- Signed-in only: tournament summary and invite entry.
- Participant only: registrations, participant directory, teams, announcements, and tournament notices.
- Organizer only: tournament settings, tier review, team overrides, and announcement management.

`proxy.ts` redirects signed-out visitors on `/invite`, `/tournament/*`, and `/admin/*`. Page loaders and actions enforce participation and organizer access; the layouts primarily supply metadata. Private and authentication pages use noindex metadata. `/ui-preview` is unavailable in production.

Every mutation repeats its authorization check on the server.
