import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { tiers } from '@/lib/marketing-content';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Tiers',
  description:
    'The T1 to T4 tier system used to balance Rift Clash tournament teams.',
  alternates: {
    canonical: '/tiers',
  },
  robots: {
    index: true,
    follow: true,
  },
};

type TierTone = (typeof tiers)[number]['tone'];

const tierCardTones: Record<TierTone, string> = {
  gold: 'border-l-tier-t1',
  silver: 'border-l-tier-t2',
  bronze: 'border-l-tier-t3',
  grey: 'border-l-tier-t4',
};

const tierBadgeTones: Record<TierTone, string> = {
  gold: 'bg-tier-t1/10 text-tier-t1',
  silver: 'bg-tier-t2/10 text-tier-t2',
  bronze: 'bg-tier-t3/10 text-tier-t3',
  grey: 'bg-tier-t4/10 text-tier-t4',
};

export default function TiersPage() {
  return (
    <div className='min-h-svh overflow-hidden bg-background text-foreground'>
      <MarketingHeader activePage='tiers' />

      <main className='mx-auto w-full max-w-page px-12 py-16 max-tablet:px-5 max-tablet:py-10'>
        <div className='max-w-3xl'>
          <p className='m-0 font-mono text-xs font-semibold tracking-[0.13em] text-success max-phone:text-3xs'>
            TEAM BALANCE · ORGANIZER REVIEW
          </p>
          <h1 className='mt-5 font-display text-4xl font-bold leading-[1.08] max-tablet:text-3xl'>
            Tier system
          </h1>
          <p className='mt-4 max-w-2xl text-lg leading-[1.6] text-secondary-foreground max-phone:text-base max-phone:leading-normal'>
            Self-assess your tier when you register. The organizer reviews it
            before it can be used to validate a submitted roster.
          </p>
        </div>

        <section
          className='mt-10 max-w-4xl'
          aria-labelledby='tier-system-title'
        >
          <div className='mb-4 flex items-end justify-between gap-5 max-phone:items-start max-phone:flex-col max-phone:gap-2'>
            <h2
              className='m-0 font-display text-xl font-bold leading-7'
              id='tier-system-title'
            >
              Rank ranges
            </h2>
            <span className='font-mono text-2xs tracking-widest text-muted-foreground'>
              SELF-ASSESS · ORGANIZER REVIEW
            </span>
          </div>

          <div className='grid grid-cols-2 gap-3.5 max-tablet:grid-cols-1'>
            {tiers.map((tier) => (
              <Card
                className={cn(
                  'flex min-h-28 items-start gap-3.5 rounded-xl border border-border border-l-3 bg-card p-4.5 py-4.5 ring-0',
                  tierCardTones[tier.tone],
                )}
                key={tier.tier}
              >
                <Badge
                  className={cn(
                    'h-11 w-11 shrink-0 rounded-lg border border-current p-0 font-display text-sm font-extrabold',
                    tierBadgeTones[tier.tone],
                  )}
                >
                  {tier.tier}
                </Badge>
                <div>
                  <h3 className='mb-1.25 mt-px text-sm font-bold leading-4.5'>
                    {tier.range}
                  </h3>
                  <p className='m-0 text-xs leading-[1.45] text-secondary-foreground'>
                    {tier.detail}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section
          className='mt-6 max-w-4xl rounded-2xl border border-border bg-card p-5'
          aria-labelledby='tier-review-title'
        >
          <h2 className='font-display text-lg font-bold' id='tier-review-title'>
            How approval affects teams
          </h2>
          <p className='mt-3 max-w-3xl text-sm leading-6 text-secondary-foreground'>
            You can join a draft team while your tier is pending, but every
            player needs an approved tier before the captain can submit the
            roster. T1 and T2 limits are checked across starters and
            substitutes.
          </p>
          <Link
            className='mt-4 inline-flex font-semibold text-primary-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
            href='/rules'
          >
            Read the team rules
          </Link>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
