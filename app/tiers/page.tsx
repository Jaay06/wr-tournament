import type { Metadata } from 'next';
import { CheckCircle2, Scale } from 'lucide-react';
import Link from 'next/link';

import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
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
  gold: 'border-tier-t1/45 bg-tier-t1/10',
  silver: 'border-tier-t2/45 bg-tier-t2/10',
  bronze: 'border-border-strong bg-card',
  grey: 'border-border-strong bg-card',
};

const tierBadgeTones: Record<TierTone, string> = {
  gold: 'bg-tier-t1/10 text-tier-t1',
  silver: 'bg-tier-t2/10 text-tier-t2',
  bronze: 'bg-tier-t3/10 text-tier-t3',
  grey: 'bg-tier-t4/10 text-tier-t4',
};

export default function TiersPage() {
  return (
    <div className='min-h-[100dvh] overflow-hidden bg-background text-foreground'>
      <MarketingHeader activePage='tiers' />

      <main className='mx-auto w-full max-w-page px-12 py-14 max-tablet:px-5 max-tablet:py-9'>
        <div className='flex items-end justify-between gap-12 max-tablet:items-start max-tablet:flex-col max-tablet:gap-6'>
          <div className='max-w-3xl'>
            <p className='m-0 font-mono text-xs font-semibold tracking-[0.16em] text-primary max-phone:text-3xs'>
              TEAM BALANCE / ORGANIZER REVIEW
            </p>
            <h1 className='mt-5 text-balance font-display text-[clamp(2.375rem,4vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.045em]'>
              Four tiers. One fair room.
            </h1>
            <p className='mt-4 max-w-2xl text-base leading-[1.6] text-secondary-foreground max-phone:text-base max-phone:leading-normal'>
              Self-assess when you register. The organizer confirms the tier
              used to validate every roster.
            </p>
          </div>

          <aside className='flex min-w-80 items-center justify-between gap-8 rounded-xl border border-primary/45 bg-warning-soft px-5 py-5 max-phone:min-w-0 max-phone:w-full'>
            <div>
              <p className='font-mono text-3xs font-semibold tracking-[0.16em] text-warning'>
                ROSTER CEILING
              </p>
              <p className='mt-2 font-display text-2xl font-semibold'>
                1 T1 / 2 T2
              </p>
            </div>
            <Scale className='text-primary' size={28} strokeWidth={1.7} />
          </aside>
        </div>

        <section className='mt-10 w-full' aria-labelledby='tier-system-title'>
          <h2 className='sr-only' id='tier-system-title'>
            Rank ranges
          </h2>

          <div className='grid grid-cols-4 gap-3 max-tablet:grid-cols-2'>
            {tiers.map((tier) => (
              <Card
                className={cn(
                  'flex min-h-56 flex-col items-stretch justify-between rounded-xl border p-5 ring-0 max-tablet:min-h-44 max-phone:p-4',
                  tierCardTones[tier.tone],
                )}
                key={tier.tier}
              >
                <div className='flex items-center justify-between'>
                  <Badge
                    className={cn(
                      'h-auto rounded-md border border-current px-2 py-1 font-mono text-2xs font-bold tracking-widest',
                      tierBadgeTones[tier.tone],
                    )}
                  >
                    {tier.tier}
                  </Badge>
                  <span className='font-mono text-3xs tracking-widest text-muted-foreground'>
                    {tier.tier === 'T1' ? 'MAX 1' : tier.tier === 'T2' ? 'MAX 2' : 'OPEN'}
                  </span>
                </div>
                <div className='mt-10'>
                  <h3 className='mb-2 font-display text-xl font-semibold leading-tight max-phone:text-lg'>
                    {tier.range}
                  </h3>
                  <p className='m-0 text-sm leading-[1.5] text-secondary-foreground'>
                    {tier.detail}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section
          className='mt-6 flex w-full items-center justify-between gap-7 rounded-xl border border-border-strong bg-card p-5 max-tablet:items-start max-tablet:flex-col'
          aria-labelledby='tier-review-title'
        >
          <div className='flex gap-3'>
            <CheckCircle2 className='mt-0.5 shrink-0 text-success' size={19} />
            <div>
              <h2 className='font-display text-lg font-bold' id='tier-review-title'>
                What approval changes
              </h2>
              <p className='mt-2 text-sm leading-6 text-secondary-foreground'>
                Pending players can join a draft. Every player needs an
                approved tier before the captain can submit the roster.
              </p>
            </div>
          </div>
          <Link
            className={cn(
              buttonVariants({ variant: 'link' }),
              'min-h-11 shrink-0 px-0 font-semibold text-primary-muted',
            )}
            href='/rules'
          >
            Read the team rules
          </Link>
        </section>
      </main>
    </div>
  );
}
