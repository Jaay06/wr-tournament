import { randomUUID } from 'node:crypto';
import { getAccountLinkSession } from '@/lib/account-link-session';
import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Discord from 'next-auth/providers/discord';
import { and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { db } from '@/db';
import { tournamentParticipants, users } from '@/db/schema';
import {
  ACCOUNT_LINK_INTENT_COOKIE,
  verifyAccountLinkIntent,
} from '@/lib/account-link-intent';
import { verifyPassword } from '@/lib/password';
import { callbackPathFromAuthCookie } from '@/lib/redirect';
import { signInSchema } from '@/lib/validation';

const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;

export const discordEnabled = Boolean(discordClientId && discordClientSecret);

async function getParticipantForUser(userId: string) {
  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, userId))
    .limit(1);

  return participant;
}

async function getUserForSession(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return user;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const parsed = signInSchema.safeParse(credentials);

      if (!parsed.success) {
        return null;
      }

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          passwordHash: users.passwordHash,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          role: users.role,
        })
        .from(users)
        .where(and(eq(users.email, parsed.data.email), isNull(users.deletedAt)))
        .limit(1);

      if (!user?.passwordHash) {
        return null;
      }

      const passwordMatches = await verifyPassword(
        parsed.data.password,
        user.passwordHash,
      );

      if (!passwordMatches) {
        return null;
      }

      const participant = await getParticipantForUser(user.id);

      return {
        id: user.id,
        email: user.email,
        image: user.avatarUrl,
        name: user.displayName,
        role: user.role,
        hasJoinedTournament: Boolean(participant),
      };
    },
  }),
];

if (discordEnabled) {
  providers.push(
    Discord({
      clientId: discordClientId as string,
      clientSecret: discordClientSecret as string,
    }),
  );
}

export const {
  handlers,
  signIn,
  signOut,
  auth,
  unstable_update: updateSession,
} = NextAuth({
  pages: {
    signIn: '/signin',
  },
  providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ account, user }) {
      if (account?.provider !== 'discord') {
        return true;
      }

      const discordId = account.providerAccountId.trim();

      if (!discordId) {
        return false;
      }

      const cookieStore = await cookies();
      const linkSession = await getAccountLinkSession();
      const linkIntent = verifyAccountLinkIntent(
        cookieStore.get(ACCOUNT_LINK_INTENT_COOKIE)?.value,
        linkSession?.sessionId,
      );
      if (cookieStore.has(ACCOUNT_LINK_INTENT_COOKIE) &&
          (!linkIntent || linkIntent.userId !== linkSession?.userId)) {
        cookieStore.delete(ACCOUNT_LINK_INTENT_COOKIE);
        return '/tournament/account?error=AccountLinkExpired';
      }

      if (linkIntent) {
        const [[linkUser], [discordOwner]] = await Promise.all([
          db
            .select({
              id: users.id,
              email: users.email,
              discordId: users.discordId,
              displayName: users.displayName,
              avatarUrl: users.avatarUrl,
              role: users.role,
            })
            .from(users)
            .where(and(eq(users.id, linkIntent.userId), isNull(users.deletedAt)))
            .limit(1),
          db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.discordId, discordId), isNull(users.deletedAt)))
            .limit(1),
        ]);

        cookieStore.delete(ACCOUNT_LINK_INTENT_COOKIE);

        if (!linkUser) {
          return '/tournament/account?error=AccountLinkExpired';
        }

        if (discordOwner && discordOwner.id !== linkUser.id) {
          return '/tournament/account?error=DiscordAlreadyConnected';
        }

        if (linkUser.discordId && linkUser.discordId !== discordId) {
          return '/tournament/account?error=DiscordAlreadyConnected';
        }

        if (!linkUser.discordId) {
          try {
            await db
              .update(users)
              .set({ discordId, updatedAt: new Date() })
              .where(and(eq(users.id, linkUser.id), isNull(users.deletedAt)));
          } catch (error) {
            if (isUniqueViolation(error)) {
              return '/tournament/account?error=DiscordAlreadyConnected';
            }

            throw error;
          }
        }

        const participant = await getParticipantForUser(linkUser.id);

        user.id = linkUser.id;
        user.email = linkUser.email;
        user.image = linkUser.avatarUrl;
        user.name = linkUser.displayName;
        user.role = linkUser.role;
        user.hasJoinedTournament = Boolean(participant);
        return true;
      }

      if (cookieStore.has(ACCOUNT_LINK_INTENT_COOKIE)) {
        cookieStore.delete(ACCOUNT_LINK_INTENT_COOKIE);
      }

      const [existingDiscordUser] = await db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          role: users.role,
        })
        .from(users)
        .where(and(eq(users.discordId, discordId), isNull(users.deletedAt)))
        .limit(1);

      if (existingDiscordUser) {
        const participant = await getParticipantForUser(existingDiscordUser.id);

        user.id = existingDiscordUser.id;
        user.email = existingDiscordUser.email;
        user.image = existingDiscordUser.avatarUrl;
        user.name = existingDiscordUser.displayName;
        user.role = existingDiscordUser.role;
        user.hasJoinedTournament = Boolean(participant);
        return true;
      }

      const email =
        typeof user.email === 'string' ? user.email.trim().toLowerCase() : null;

      if (email) {
        const [existingEmailUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.email, email), isNull(users.deletedAt)))
          .limit(1);

        if (existingEmailUser) {
          const callbackCookie =
            cookieStore.get('__Secure-authjs.callback-url')?.value ??
            cookieStore.get('authjs.callback-url')?.value;
          const callbackUrl = callbackPathFromAuthCookie(callbackCookie);

          return `/signin?error=AccountLinkRequired&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        }
      }

      const [createdUser] = await db
        .insert(users)
        .values({
          discordId,
          email,
          displayName: user.name?.trim() || 'Discord player',
          avatarUrl: user.image ?? null,
        })
        .returning({
          id: users.id,
          role: users.role,
        });

      user.id = createdUser.id;
      user.role = createdUser.role;
      return true;
    },
    async jwt({ token, user }) {
      if (user || typeof token.linkSessionId !== 'string') {
        token.linkSessionId = randomUUID();
      }
      const userId = user?.id ?? token.sub;

      if (!userId) {
        return token;
      }

      const sessionUser = await getUserForSession(userId);

      if (!sessionUser) {
        return { ...token, sub: undefined };
      }

      const participant = await getParticipantForUser(sessionUser.id);

      token.sub = sessionUser.id;
      token.name = sessionUser.displayName;
      token.email = sessionUser.email ?? undefined;
      token.picture = sessionUser.avatarUrl ?? undefined;
      token.role = sessionUser.role;
      token.hasJoinedTournament = Boolean(participant);

      return token;
    },
    async session({ session, token }) {
      if (!token.sub) {
        return session;
      }

      session.user.id = token.sub;
      session.user.name = token.name;
      session.user.email = token.email ?? '';
      session.user.image = token.picture;
      session.user.role = token.role === 'organizer' ? 'organizer' : 'user';
      session.user.hasJoinedTournament = Boolean(token.hasJoinedTournament);

      return session;
    },
  },
});
