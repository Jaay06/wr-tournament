import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { auth } from '@/auth';
import { MotionReveal } from '@/components/marketing/motion-reveal';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { RiftClashLogo } from '@/components/brand/rift-clash-logo';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { accessSteps } from '@/lib/marketing-content';
import { tournamentEntryFor } from '@/lib/tournament-entry';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function Home() {
  const entry = tournamentEntryFor(await auth());

  return (
    <div
      className='min-h-[100dvh] overflow-hidden bg-background text-foreground'
      id='top'
    >
      <MarketingHeader activePage='overview' entry={entry} />

      <main>
        <section
          className='mx-auto grid w-full max-w-page grid-cols-[minmax(0,1fr)_420px] items-center gap-16 px-12 py-18 pb-16 max-desktop:grid-cols-[minmax(0,1fr)_380px] max-desktop:gap-9 max-tablet:grid-cols-1 max-tablet:gap-8 max-tablet:px-5 max-tablet:py-10.5 max-tablet:pb-9.5'
          aria-labelledby='hero-title'
        >
          <MotionReveal>
            <div className='max-w-hero max-tablet:max-w-none'>
              <p className='m-0 flex items-center gap-2.5 font-mono text-xs font-semibold tracking-[0.13em] text-success max-phone:text-3xs'>
                <span
                  className='size-1.75 shrink-0 rounded-full bg-success shadow-sm shadow-success/60'
                  aria-hidden='true'
                />
                PRIVATE TOURNAMENT · INVITE ONLY
              </p>

              <div className='mt-6.5 max-phone:mt-5.5'>
                <h1 className='m-0' id='hero-title'>
                  <RiftClashLogo className='block h-auto w-[min(100%,22rem)] max-tablet:w-[min(100%,20rem)] max-phone:w-[min(100%,18rem)]' />
                  <span className='sr-only'>Rift Clash</span>
                </h1>
                <p className='mt-7 max-w-copy text-lg leading-[1.6] text-secondary-foreground max-phone:mt-5.5 max-phone:text-base max-phone:leading-normal'>
                  A simple place for friends to register, settle tiers, form
                  teams, and get into the game.
                </p>
              </div>

              <div className='mt-7 flex flex-wrap items-center gap-3.5 max-phone:grid max-phone:grid-cols-1'>
                <Link
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'inline-flex min-h-12.5 rounded-md bg-primary px-5.5 py-3.5 text-base font-bold text-primary-foreground shadow-xl shadow-primary/35 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted max-phone:w-full',
                  )}
                  href={entry.href}
                >
                  {entry.label}
                  <ArrowRight aria-hidden='true' size={16} strokeWidth={1.8} />
                </Link>
                <Link
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'lg' }),
                    'inline-flex min-h-12.5 rounded-md border border-border bg-secondary px-5.5 py-3.5 text-base font-bold text-foreground hover:border-border-strong hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted max-phone:w-full',
                  )}
                  href='/rules'
                >
                  View team rules
                </Link>
              </div>

              <div
                className='mt-7.5 flex flex-wrap items-center gap-4.5 font-mono text-xs text-secondary-foreground max-phone:items-start max-phone:flex-col max-phone:gap-2.5'
                aria-label='Tournament access details'
              >
                <span className='inline-flex items-center gap-1.75 before:size-1.25 before:shrink-0 before:rounded-full before:bg-primary before:content-[""]'>
                  Discord or email sign-in
                </span>
                <span className='inline-flex items-center gap-1.75 before:size-1.25 before:shrink-0 before:rounded-full before:bg-success before:content-[""]'>
                  Organizer-approved tiers
                </span>
                <span className='inline-flex items-center gap-1.75 before:size-1.25 before:shrink-0 before:rounded-full before:bg-success before:content-[""]'>
                  Friends only
                </span>
              </div>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.06}>
            <Card
              className='overflow-hidden rounded-card border border-border bg-card gap-0 py-0 shadow-2xl shadow-background/40 ring-0'
              id='private-access'
              role='complementary'
            >
              <div className='flex items-center justify-between px-5.5 pt-5 font-mono text-2xs font-semibold tracking-[0.12em] text-muted-foreground'>
                <span>PRIVATE ACCESS</span>
                <Badge className='h-auto rounded-full border-primary/25 bg-primary/15 px-2 py-1 font-mono text-2xs tracking-[0.04em] text-primary-muted'>
                  <i
                    className='size-1.5 rounded-full bg-primary'
                    aria-hidden='true'
                  />
                  INVITE REQUIRED
                </Badge>
              </div>

              <h2 className='mt-5.5 px-5.5 font-display text-2xl font-bold leading-[1.15]'>
                {entry.title}
              </h2>
              <p className='mx-5.5 mb-5 mt-2 text-sm leading-[1.55] text-secondary-foreground'>
                {entry.description}
              </p>

              <ol className='m-0 flex list-none flex-col p-0'>
                {accessSteps.map(([number, title, description]) => (
                  <li
                    className='flex items-center gap-3.5 border-t border-border px-5.5 py-4'
                    key={number}
                  >
                    <span className='grid size-9.5 shrink-0 place-items-center rounded-lg border border-border bg-background font-mono text-xs font-bold text-primary-muted'>
                      {number}
                    </span>
                    <span className='flex min-w-0 flex-col gap-0.75'>
                      <strong className='text-sm leading-4.5 text-foreground'>
                        {title}
                      </strong>
                      <small className='text-xs leading-4.25 text-muted-foreground'>
                        {description}
                      </small>
                    </span>
                  </li>
                ))}
              </ol>

              <div className='border-t border-border bg-background px-5.5 py-3.5 text-xs text-muted-foreground'>
                <span>{entry.status}</span>
              </div>
            </Card>
          </MotionReveal>
        </section>
      </main>
    </div>
  );
}
