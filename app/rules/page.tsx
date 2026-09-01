import type { Metadata } from 'next';
import Link from 'next/link';

import { auth } from '@/auth';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Badge } from '@/components/ui/badge';
import { tournamentEntryFor } from '@/lib/tournament-entry';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rules',
  description:
    'The roster and tier rules for the private Rift Clash Wild Rift tournament.',
  alternates: {
    canonical: '/rules',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const teamRules = [
  {
    badge: '5-7',
    title: 'Five starters',
    description: 'Build five starter slots and add up to two substitutes.',
    tone: 'neutral',
  },
  {
    badge: 'T1',
    title: 'Maximum one T1',
    description: 'The cap covers both starters and substitutes.',
    tone: 't1',
  },
  {
    badge: 'T2',
    title: 'Maximum two T2',
    description: 'T3 and T4 have no roster cap.',
    tone: 't2',
  },
] as const;

const submissionRules = [
  'A player can belong to only one team.',
  'The player who creates a team becomes its captain and manages the lineup.',
  'Every player on the roster needs an organizer-approved tier.',
  'Starter slots are Baron, Jungle, Mid, Dragon, and Support.',
  'Role preference mismatches show a warning but do not block submission.',
  'Submit before the registration deadline. Submitted teams stay locked unless the organizer unlocks them.',
] as const;

const tierBadgeTones = {
  neutral: 'text-tier-t1',
  t1: 'border-tier-t1/20 bg-tier-t1/10 text-tier-t1',
  t2: 'border-tier-t2/20 bg-tier-t2/10 text-tier-t2',
} as const;

export default async function RulesPage() {
  const entry = tournamentEntryFor(await auth());

  return (
    <div className='min-h-svh overflow-hidden bg-background text-foreground'>
      <MarketingHeader activePage='rules' entry={entry} />

      <main className='mx-auto w-full max-w-page px-12 py-16 max-tablet:px-5 max-tablet:py-10'>
        <div className='max-w-3xl'>
          <p className='m-0 font-mono text-xs font-semibold tracking-[0.13em] text-success max-phone:text-3xs'>
            ROSTER VALIDATION · ENFORCED
          </p>
          <h1 className='mt-5 font-display text-4xl font-bold leading-[1.08] max-tablet:text-3xl'>
            Tournament rules
          </h1>
          <p className='mt-4 max-w-2xl text-lg leading-[1.6] text-secondary-foreground max-phone:text-base max-phone:leading-normal'>
            Keep the roster balanced, get every tier approved, and submit a
            complete team before the deadline.
          </p>
        </div>

        <section
          className='mt-10 overflow-hidden rounded-2xl border border-border bg-card ring-0'
          aria-labelledby='team-rules-title'
        >
          <div className='flex items-center gap-2.5 border-b border-border bg-linear-to-r from-secondary to-card px-5 py-4'>
            <span
              className='grid size-7.5 shrink-0 place-items-center rounded-lg bg-primary text-lg text-primary-foreground'
              aria-hidden='true'
            >
              ◇
            </span>
            <h2
              className='m-0 font-display text-base font-bold leading-5'
              id='team-rules-title'
            >
              Team rules
            </h2>
            <Badge className='ml-auto h-auto rounded-full bg-primary/15 px-2 py-1 font-mono text-3xs font-semibold text-primary-muted'>
              ENFORCED
            </Badge>
          </div>

          <ul className='m-0 list-none p-0'>
            {teamRules.map((rule) => (
              <li
                className='flex min-h-18.5 items-center gap-3.5 border-b border-border px-5 py-4'
                key={rule.badge}
              >
                <Badge
                  className={cn(
                    'h-9 w-10 shrink-0 rounded-lg border border-border bg-background p-0 font-mono text-xs font-bold',
                    tierBadgeTones[rule.tone],
                  )}
                >
                  {rule.badge}
                </Badge>
                <span className='flex min-w-0 flex-col gap-0.75'>
                  <strong className='text-sm leading-4.5'>{rule.title}</strong>
                  <small className='text-xs leading-4.25 text-muted-foreground'>
                    {rule.description}
                  </small>
                </span>
                <span
                  className='ml-auto grid size-5.5 shrink-0 place-items-center rounded-full bg-success/15 text-success'
                  aria-label='Rule enforced'
                >
                  <Check size={10} />
                </span>
              </li>
            ))}
          </ul>

          <div className='flex items-center justify-between gap-3 bg-background px-5 py-3 text-2xs text-muted-foreground max-phone:items-start max-phone:flex-col'>
            <span className='inline-flex items-center gap-1.5 font-mono text-secondary-foreground'>
              <i
                className='size-1.5 rounded-full bg-success'
                aria-hidden='true'
              />
              ROSTER VALIDATION
            </span>
            <span>Role coverage warns, but does not block.</span>
          </div>
        </section>

        <section
          className='mt-6 rounded-2xl border border-border bg-card p-5'
          aria-labelledby='submission-rules-title'
        >
          <h2
            className='font-display text-lg font-bold'
            id='submission-rules-title'
          >
            Before you submit
          </h2>
          <ul className='mt-4 grid gap-3 text-sm leading-6 text-secondary-foreground'>
            {submissionRules.map((rule) => (
              <li className='flex gap-2.5' key={rule}>
                <Check size={20} />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className='mt-8 text-sm text-muted-foreground'>
          Ready to continue?{' '}
          <Button variant={'link'}>
            <Link className='font-semibold ' href={entry.href}>
              {entry.label}
            </Link>
          </Button>
        </p>
      </main>
    </div>
  );
}

// function CheckIcon() {
//   return (
//     <svg
//       aria-hidden='true'
//       className='mt-1 size-3.5 shrink-0'
//       viewBox='0 0 12 12'
//       width='12'
//       height='12'
//     >
//       <path
//         d='m3 6 2 2 4-4'
//         fill='none'
//         stroke='currentColor'
//         strokeLinecap='round'
//         strokeLinejoin='round'
//         strokeWidth='1.4'
//       />
//     </svg>
//   );
// }
