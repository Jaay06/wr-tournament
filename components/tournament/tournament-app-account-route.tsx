'use client';

import { useFormStatus } from 'react-dom';
import { Check, Link2, Mail, MessageCircle, ShieldCheck } from 'lucide-react';

import { startDiscordAccountLink } from '@/app/tournament/account/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AccountConnectionsData } from '@/lib/tournament-types';
import {
  Card,
  Kicker,
  PageFrame,
  SectionHeading,
  StatusPill,
} from './tournament-app-shared';
import { TournamentAppRouteFrame } from './tournament-app-route-frame';
import type { TournamentAppProps } from './tournament-app-shared';
import { discordErrorMessage } from '@/lib/discord-error';
import { cn } from '@/lib/utils';

function LinkDiscordButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className='min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg shadow-primary/15 hover:bg-primary-hover'
      disabled={pending}
      size='lg'
      type='submit'
    >
      <MessageCircle aria-hidden='true' size={16} />
      {pending ? 'Opening Discord...' : 'Connect Discord'}
    </Button>
  );
}

function Notice({ notice }: { notice?: TournamentAppProps['accountNotice'] }) {
  if (!notice) return null;

  const content = typeof notice === 'object' ? {
    title: 'Discord could not connect',
    body: discordErrorMessage(notice.error),
    className: 'border-danger/25 bg-danger-soft/70',
    icon: <ShieldCheck aria-hidden='true' size={17} />,
  } : {
    linked: {
      title: 'Discord is connected',
      body: 'You can now use Discord or your email and password to sign in to this account.',
      className: 'border-success/25 bg-success-soft/70',
      icon: <Check aria-hidden='true' size={17} />,
    },
    'already-connected': {
      title: 'That Discord account is already in use',
      body: 'Choose a different Discord account or sign in with the account it is already connected to.',
      className: 'border-danger/25 bg-danger-soft/70',
      icon: <ShieldCheck aria-hidden='true' size={17} />,
    },
    expired: {
      title: 'The connection attempt expired',
      body: 'Start the Discord connection again to continue.',
      className: 'border-warning/25 bg-warning-soft/70',
      icon: <Link2 aria-hidden='true' size={17} />,
    },
  }[notice];

  return (
    <Card
      role={notice === 'linked' ? 'status' : 'alert'}
      className={cn(
        'grid grid-cols-[auto_1fr] gap-3 rounded-2xl p-4',
        content.className,
      )}
    >
      <span className='mt-0.5 inline-block text-current'>{content.icon}</span>
      <div>
        <p className='m-0 text-sm font-semibold'>{content.title}</p>
        <p className='mt-1 mb-0 text-sm leading-5 text-secondary-foreground'>
          {content.body}
        </p>
      </div>
    </Card>
  );
}

function ConnectionRow({
  account,
  kind,
}: {
  account: AccountConnectionsData;
  kind: 'email' | 'discord';
}) {
  const email = kind === 'email';
  const connected = email ? Boolean(account.email) : account.discordConnected;

  return (
    <div className='flex flex-col gap-4 p-5 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6'>
      <div className='flex min-w-0 items-start gap-3.5'>
        <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary-muted'>
          {email ? (
            <Mail aria-hidden='true' size={18} />
          ) : (
            <MessageCircle aria-hidden='true' size={18} />
          )}
        </span>
        <div className='min-w-0'>
          <p className='m-0 text-base font-semibold'>
            {email ? 'Email and password' : 'Discord'}
          </p>
          <p className='mt-1 mb-0 truncate text-sm text-muted-foreground'>
            {email
              ? (account.email ?? 'No email sign-in is connected.')
              : connected
                ? 'Connected to this tournament account.'
                : 'Use Discord as another way to sign in.'}
          </p>
        </div>
      </div>
      <div className='flex shrink-0 items-center gap-3 tablet:justify-end'>
        <StatusPill tone={connected ? 'success' : 'neutral'}>
          {connected ? 'CONNECTED' : 'NOT CONNECTED'}
        </StatusPill>
        {!email && !connected && account.discordEnabled ? (
          <form action={startDiscordAccountLink}>
            <LinkDiscordButton />
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function AccountConnectionsView({
  account,
  notice,
}: {
  account?: AccountConnectionsData;
  notice?: TournamentAppProps['accountNotice'];
}) {
  const connectionData = account ?? {
    email: null,
    discordConnected: false,
    discordEnabled: false,
  };

  return (
    <PageFrame>
      <div className='mx-auto flex max-w-3xl flex-col gap-7'>
        <SectionHeading
          detail='Choose the sign-in methods that should open this tournament account. Your player profile and tournament progress stay on the same account.'
          eyebrow='ACCOUNT'
          title='Connected accounts'
        />

        <Notice notice={notice} />

        <Card className='overflow-hidden rounded-card border-border bg-card'>
          <div className='flex items-start gap-3 border-b border-border bg-secondary/45 p-5 desktop:p-6'>
            <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-muted'>
              <Link2 aria-hidden='true' size={19} />
            </span>
            <div>
              <Kicker className='text-primary-muted'>SIGN-IN METHODS</Kicker>
              <h2 className='mt-2 mb-0 font-display text-xl font-bold tracking-[-0.025em]'>
                Keep one account across providers
              </h2>
              <p className='mt-2 mb-0 max-w-2xl text-sm leading-5 text-secondary-foreground'>
                Connecting Discord adds a second way to sign in. It does not
                merge accounts automatically or create a second player record.
              </p>
            </div>
          </div>
          <div className='divide-y divide-border'>
            <ConnectionRow account={connectionData} kind='email' />
            <ConnectionRow account={connectionData} kind='discord' />
          </div>
        </Card>

        <div className='flex items-start gap-3 rounded-2xl border border-border bg-secondary/45 p-4 text-sm leading-5 text-secondary-foreground'>
          <ShieldCheck
            aria-hidden='true'
            className='mt-0.5 shrink-0 text-success'
            size={17}
          />
          <p className='m-0'>
            We ask you to sign in with Discord before connecting it so the
            provider is attached to this account, not guessed from an email
            address.
          </p>
        </div>

        {!connectionData.discordEnabled ? (
          <Badge className='w-fit rounded-full border border-warning/25 bg-warning-soft px-3 py-1.5 font-mono text-2xs font-semibold tracking-[0.08em] text-warning'>
            DISCORD SIGN-IN IS NOT CONFIGURED
          </Badge>
        ) : null}
      </div>
    </PageFrame>
  );
}

export function TournamentAccountRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <AccountConnectionsView
        account={props.account}
        notice={props.accountNotice}
      />
    </TournamentAppRouteFrame>
  );
}
