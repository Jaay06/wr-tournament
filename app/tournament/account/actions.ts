'use server';

import { AuthError } from 'next-auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';

import { auth, discordEnabled, signIn } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import {
  ACCOUNT_LINK_INTENT_COOKIE,
  ACCOUNT_LINK_INTENT_MAX_AGE,
  createAccountLinkIntent,
} from '@/lib/account-link-intent';

import { getAccountLinkSession } from '@/lib/account-link-session';

const accountPath = '/tournament/account';

export async function startDiscordAccountLink() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(accountPath)}`);
  }

  if (!discordEnabled) {
    redirect(`${accountPath}?error=DiscordUnavailable`);
  }

  const cookieStore = await cookies();
  const linkSession = await getAccountLinkSession();

  if (!linkSession || linkSession.userId !== session.user.id) {
    redirect(`${accountPath}?error=AccountLinkExpired`);
  }

  const [user] = await db
    .select({ discordId: users.discordId })
    .from(users)
    .where(and(eq(users.id, session.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (!user) {
    redirect(`${accountPath}?error=AccountLinkExpired`);
  }

  if (user.discordId) {
    redirect(`${accountPath}?error=DiscordAlreadyConnected`);
  }

  cookieStore.set({
    name: ACCOUNT_LINK_INTENT_COOKIE,
    value: createAccountLinkIntent({
      userId: session.user.id,
      sessionId: linkSession.sessionId,
    }),
    httpOnly: true,
    maxAge: ACCOUNT_LINK_INTENT_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  try {
    await signIn('discord', { redirectTo: `${accountPath}?linked=1` });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    cookieStore.delete(ACCOUNT_LINK_INTENT_COOKIE);
    redirect(`${accountPath}?error=${encodeURIComponent(error.type)}`);
  }
}
