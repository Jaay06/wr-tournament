import type { Metadata } from 'next';

import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Card } from '@/components/ui/card';
import { howItWorksSteps } from '@/lib/marketing-content';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How friends enter Rift Clash, register, build a team, and submit a roster.',
  alternates: {
    canonical: '/how-it-works',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HowItWorksPage() {
  const stepPairs = Array.from({ length: 3 }, (_, index) =>
    howItWorksSteps.slice(index * 2, index * 2 + 2),
  );

  return (
    <div className='min-h-[100dvh] overflow-hidden bg-background text-foreground'>
      <MarketingHeader activePage='how-it-works' />

      <main className='mx-auto w-full max-w-page px-12 py-16 max-tablet:px-5 max-tablet:py-10'>
        <div className='max-w-3xl'>
          <p className='m-0 font-mono text-xs font-semibold tracking-[0.16em] text-primary max-phone:text-3xs'>
            TOURNAMENT FLOW / SIX CHECKPOINTS
          </p>
          <h1 className='mt-5 text-balance font-display text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.02] tracking-[-0.045em]'>
            Invite in. Lock five. Play.
          </h1>
          <p className='mt-4 max-w-2xl text-lg leading-[1.6] text-secondary-foreground max-phone:text-base max-phone:leading-normal'>
            Follow the short path from your private invite to a complete,
            submitted team roster.
          </p>
        </div>

        <section className='mt-10' aria-labelledby='tournament-flow-title'>
          <div className='mb-4 flex items-end justify-between gap-5 max-phone:items-start max-phone:flex-col max-phone:gap-2'>
            <h2
              className='m-0 font-display text-xl font-bold leading-7'
              id='tournament-flow-title'
            >
              From invite to roster
            </h2>
            <span className='font-mono text-2xs tracking-widest text-muted-foreground'>
              SIX STEPS
            </span>
          </div>

          <ol className='m-0 flex list-none flex-col gap-3 p-0'>
            {stepPairs.map((pair, pairIndex) => (
              <li key={pair[0][0]}>
                <Card className='grid min-h-31 grid-cols-[7.5rem_minmax(0,1fr)_minmax(0,1fr)] items-stretch overflow-hidden rounded-xl border border-border-strong bg-card p-0 ring-0 max-tablet:grid-cols-[5.5rem_minmax(0,1fr)] max-phone:grid-cols-1'>
                  <div
                    className={cn(
                      'grid place-items-center border-r border-border bg-secondary/45 font-mono text-lg font-bold tracking-[0.12em] text-muted-foreground max-phone:min-h-14 max-phone:border-b max-phone:border-r-0',
                      pairIndex === 0 &&
                        'bg-primary text-primary-foreground',
                    )}
                  >
                    {pair[0][0]} / {pair[1][0]}
                  </div>
                  {pair.map(([number, title, description], index) => (
                    <div
                      className={cn(
                        'flex min-w-0 items-center gap-4 px-6 py-5 max-phone:px-4 max-phone:py-4',
                        index === 1 &&
                          'border-l border-border max-tablet:border-l-0 max-tablet:border-t',
                      )}
                      key={number}
                    >
                      <span className='font-mono text-2xs font-bold text-primary'>
                        {number}
                      </span>
                      <span className='flex min-w-0 flex-col gap-1'>
                        <strong className='text-sm leading-5'>{title}</strong>
                        <small className='text-xs leading-5 text-muted-foreground'>
                          {description}
                        </small>
                      </span>
                    </div>
                  ))}
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section
          className='mt-6 flex items-center justify-between gap-8 rounded-xl border border-success/30 bg-success-soft p-5 max-phone:items-start max-phone:flex-col max-phone:gap-2'
          aria-labelledby='next-step-title'
        >
          <div>
            <h2
              className='font-display text-lg font-bold text-success'
              id='next-step-title'
            >
              Ready to join?
            </h2>
            <p className='mt-1 text-sm leading-6 text-success/75'>
              Sign in, then use the private invite link or code shared by the
              organizer.
            </p>
          </div>
          <span className='shrink-0 font-mono text-3xs tracking-widest text-success'>
            PRIVATE BY DESIGN
          </span>
        </section>
      </main>
    </div>
  );
}
