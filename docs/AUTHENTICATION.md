# Authentication and private access

## Supported sign-in methods

The MVP supports:

- Discord OAuth.
- Email and password.

Email verification is not required. Email delivery is used only for password reset.

## Account rules

- Email addresses are normalized and unique when present.
- Discord identities are unique.
- Passwords are hashed with a current password-hashing algorithm and never logged or stored in plain text.
- A Discord-only user may add credentials later only through an authenticated account-linking flow.
- Accounts are not linked automatically only because a Discord email matches an existing credentials email.
- Sign-in responses must not reveal whether an email address exists.
- Authentication endpoints require rate limiting appropriate to the deployment environment.

## Sessions

Use secure, HTTP-only cookies with JWT-backed sessions unless implementation constraints require a database session. Production cookies must use secure transport and an appropriate same-site policy.

The session exposes only the identity and role needed by the app:

- User identifier.
- Display name and avatar when available.
- user or organizer account role.
- Whether the user has joined the tournament.

Server-side authorization remains authoritative. Hiding a control in the interface is not access control.

## Tournament invite

Authentication and tournament access are separate.

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
- The token expires after a short configured period.
- The token is invalid after first use.
- A successful reset invalidates any other outstanding reset tokens for the user.
- The request endpoint returns a neutral response even when no account matches.
- Discord-only accounts receive no password-reset email unless credentials have been added.

In local development, the reset link may be logged to a protected development console when email delivery is not configured. It must never be logged in production.

## Route protection

- Public: sign-in, registration, OAuth callback, password-reset request, and password-reset completion.
- Signed-in only: tournament summary and invite entry.
- Participant only: registrations, participant directory, teams, announcements, and tournament notices.
- Organizer only: tournament settings, tier review, team overrides, and announcement management.

Every mutation repeats its authorization check on the server.
