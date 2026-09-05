import type { Metadata } from 'next';
import { and, eq, isNull } from 'drizzle-orm';

import { discordEnabled } from '@/auth';
import { TournamentAppClient } from '@/components/tournament/tournament-app-client';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getRoomPageData } from '@/lib/room-page-data';
import { getRegistrationForParticipant } from '@/lib/tournament-data';

export const metadata: Metadata = {
  title: 'Connected accounts',
};

type AccountSearchParams = {
  linked?: string | string[];
  error?: string | string[];
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<AccountSearchParams>;
}) {
  const params = await searchParams;
  const { participant, shell, userId } = await getRoomPageData(
    '/tournament/account',
  );
  const [user, registration] = await Promise.all([
    db
      .select({ email: users.email, discordId: users.discordId })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1)
      .then(([currentUser]) => currentUser),
    getRegistrationForParticipant(participant.id),
  ]);

  return (
    <TournamentAppClient
      {...shell}
      account={{
        discordConnected: Boolean(user?.discordId),
        discordEnabled,
        email: user?.email ?? null,
      }}
      accountNotice={
        firstSearchParam(params.linked) === '1' && !params.error && Boolean(user?.discordId)
          ? 'linked'
          : firstSearchParam(params.error) === 'DiscordAlreadyConnected'
            ? 'already-connected'
            : firstSearchParam(params.error) === 'AccountLinkExpired'
              ? 'expired'
              : firstSearchParam(params.error)
                ? { error: firstSearchParam(params.error)! }
                : undefined
      }
      registration={registration}
      view='account'
    />
  );
}
