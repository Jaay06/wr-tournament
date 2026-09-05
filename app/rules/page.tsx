import type { Metadata } from 'next';

import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

export default function RulesPage() {
  return (
    <div className='min-h-[100dvh] overflow-hidden bg-background text-foreground'>
      <MarketingHeader activePage='rules' />

      <main className='mx-auto w-full max-w-page px-12 py-14 max-tablet:px-5 max-tablet:py-9'>
        <div className='flex items-end justify-between gap-10 max-tablet:items-start max-tablet:flex-col max-tablet:gap-6'>
          <div className='max-w-3xl'>
            <p className='m-0 font-mono text-xs font-semibold tracking-[0.16em] text-primary max-phone:text-3xs'>
              ROSTER VALIDATION / ENFORCED
            </p>
            <h1 className='mt-5 text-balance font-display text-[clamp(2.375rem,4vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.045em]'>
              Know what blocks a roster.
            </h1>
            <p className='mt-4 max-w-2xl text-base leading-[1.6] text-secondary-foreground max-phone:text-base max-phone:leading-normal'>
              Build five starters, respect the tier ceiling, and submit before
              the room closes.
            </p>
          </div>
          <aside className='flex items-center gap-3 rounded-xl border border-success/35 bg-success-soft px-5 py-4'>
            <span className='grid size-8 place-items-center rounded-full border border-success/40 text-success'>
              <Check size={15} />
            </span>
            <div>
              <p className='text-sm font-semibold text-success'>
                Warnings do not block
              </p>
              <p className='mt-1 text-xs text-success/75'>
                Role preferences stay advisory.
              </p>
            </div>
          </aside>
        </div>

        <div className='mt-10 grid grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.4fr)] gap-4 max-tablet:grid-cols-1'>
          <section
            className='overflow-hidden rounded-xl border border-border-strong bg-card ring-0'
            aria-labelledby='team-rules-title'
          >
            <div className='flex items-center gap-2.5 border-b border-border bg-secondary/45 px-5 py-4'>
              <h2
                className='m-0 font-display text-xl font-bold leading-5'
                id='team-rules-title'
              >
                Team rules
              </h2>
              <Badge className='ml-auto h-auto rounded-md bg-primary/15 px-2 py-1 font-mono text-3xs font-semibold text-primary-muted'>
                ENFORCED
              </Badge>
            </div>

            <ul className='m-0 list-none p-0'>
              {teamRules.map((rule) => (
                <li
                  className='flex min-h-20 items-center gap-3.5 border-b border-border px-5 py-4'
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

            <div className='flex items-center justify-between gap-3 bg-secondary/35 px-5 py-3 text-2xs text-muted-foreground max-phone:items-start max-phone:flex-col'>
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
            className='rounded-xl border border-border-strong bg-card p-5'
            aria-labelledby='submission-rules-title'
          >
            <h2
              className='font-display text-lg font-bold'
              id='submission-rules-title'
            >
              Before you submit
            </h2>
            <ul className='mt-4 grid grid-cols-2 gap-x-6 text-sm leading-6 text-secondary-foreground max-phone:grid-cols-1'>
              {submissionRules.map((rule) => (
                <li
                  className='flex gap-2.5 border-b border-border py-3'
                  key={rule}
                >
                  <Check className='shrink-0 text-success' size={18} />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className='mt-5 flex items-center justify-between gap-4 rounded-xl border border-warning/40 bg-warning-soft px-5 py-4 text-sm text-warning max-phone:items-start max-phone:flex-col'>
          <span>A registration change can invalidate a submitted team.</span>
          <span className='shrink-0 font-mono text-3xs tracking-widest'>
            INVALID ROSTERS RETURN TO DRAFT
          </span>
        </div>
      </main>
    </div>
  );
}
