import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Credentials from 'next-auth/providers/credentials';
import Discord from 'next-auth/providers/discord';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { tournamentParticipants, users } from '@/db/schema';
import { verifyPassword } from '@/lib/password';
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
    .where(eq(users.id, userId))
    .limit(1);

  return user;
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
        .where(eq(users.email, parsed.data.email))
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

export const { handlers, signIn, signOut, auth } = NextAuth({
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

      const [existingDiscordUser] = await db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          role: users.role,
        })
        .from(users)
        .where(eq(users.discordId, discordId))
        .limit(1);

      if (existingDiscordUser) {
        user.id = existingDiscordUser.id;
        user.email = existingDiscordUser.email;
        user.image = existingDiscordUser.avatarUrl;
        user.name = existingDiscordUser.displayName;
        user.role = existingDiscordUser.role;
        return true;
      }

      const email =
        typeof user.email === 'string' ? user.email.trim().toLowerCase() : null;

      if (email) {
        const [existingEmailUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingEmailUser) {
          return '/signin?error=AccountLinkRequired';
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
    async jwt({ token }) {
      if (!token.sub) {
        return token;
      }

      const user = await getUserForSession(token.sub);

      if (!user) {
        return { ...token, sub: undefined };
      }

      const participant = await getParticipantForUser(user.id);

      token.name = user.displayName;
      token.email = user.email ?? undefined;
      token.picture = user.avatarUrl ?? undefined;
      token.role = user.role;
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
