import type { Metadata } from 'next';
import Link from 'next/link';

import { MarketingHeader } from '@/components/marketing/marketing-header';
import { Card } from '@/components/ui/card';
import { howItWorksSteps } from '@/lib/marketing-content';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  return (
    <div className='overflow-hidden bg-background text-foreground'>
      <MarketingHeader activePage='how-it-works' />

      <main className='mx-auto w-full max-w-page px-12 py-16 max-tablet:px-5 max-tablet:py-10'>
        <div className='max-w-3xl'>
          <p className='m-0 font-mono text-xs font-semibold tracking-[0.13em] text-success max-phone:text-3xs'>
            PRIVATE ENTRY · TEAM FORMATION
          </p>
          <h1 className='mt-5 font-display text-4xl font-bold leading-[1.08] max-tablet:text-3xl'>
            How it works
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

          <ol className='m-0 grid list-none grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 p-0 '>
            {howItWorksSteps.map(([number, title, description], index) => (
              <li key={number}>
                <Card className='flex flex-row min-h-24 items-center gap-3.5 rounded-xl border border-border bg-card p-4.5 ring-0'>
                  <span
                    className={cn(
                      'grid size-9.5 shrink-0 place-items-center rounded-lg border font-mono text-xs font-bold',
                      index === 0
                        ? ' border-primary bg-primary text-primary-foreground'
                        : ' border-border bg-secondary text-secondary-foreground',
                    )}
                  >
                    {number}
                  </span>
                  <span className='flex min-w-0 flex-col gap-0.75'>
                    <strong className='text-sm leading-4.5'>{title}</strong>
                    <small className='text-xs leading-4.25 text-muted-foreground'>
                      {description}
                    </small>
                  </span>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section
          className='mt-6 rounded-2xl border border-border bg-card p-5'
          aria-labelledby='next-step-title'
        >
          <h2 className='font-display text-lg font-bold' id='next-step-title'>
            Ready to join?
          </h2>
          <p className=' text-sm leading-6 text-secondary-foreground'>
            Sign in, then use the private invite link or code shared by the
            organizer. Tournament data stays private to people who have joined.
            <Button variant={'link'} className={'mt-2 underline'}>
              <Link
                className='font-semibold '
                href='/signin?callbackUrl=%2Finvite'
              >
                Enter the tournament
              </Link>
            </Button>
          </p>
        </section>
      </main>
    </div>
  );
}
