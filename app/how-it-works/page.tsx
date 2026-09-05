import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/auth';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { buttonVariants } from '@/components/ui/button';
import { howItWorksSteps } from '@/lib/marketing-content';
import { tournamentEntryFor } from '@/lib/tournament-entry';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'How friends enter Rift Clash, register, build a team, and submit a roster.',
  alternates: { canonical: '/how-it-works' },
  robots: { index: true, follow: true },
};

export default async function HowItWorksPage() {
  const entry = tournamentEntryFor(await auth());
  return (
    <div className='min-h-[100dvh] bg-background text-foreground'>
      <MarketingHeader activePage='how-it-works' entry={entry} />
      <main className='mx-auto w-full max-w-page px-12 py-14 max-tablet:px-5 max-tablet:py-9'>
        <p className='font-mono text-[10px] font-semibold tracking-[0.2em] text-primary'>PRIVATE ENTRY / TEAM FORMATION</p>
        <h1 className='mt-5 font-display text-[clamp(2.375rem,4vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.04em]'>Invite in. Lock five. Play.</h1>
        <p className='mt-4 max-w-2xl text-base leading-relaxed text-secondary-foreground'>One short route from your private code to a tournament-ready roster.</p>
        <section className='mt-8 overflow-hidden rounded-2xl border border-border-strong bg-card' aria-label='From invite to roster'>
          <ol className='grid grid-cols-2 max-tablet:grid-cols-1'>
            {howItWorksSteps.map(([number, title, description], index) => (
              <li key={number} className={cn('flex min-w-0 items-stretch border-b border-border last:border-b-0 tablet:[&:nth-last-child(2)]:border-b-0', index % 2 === 0 && 'tablet:border-r')}>
                <span className={cn('grid w-20 shrink-0 place-items-center bg-secondary font-mono text-xl text-primary max-tablet:w-12 max-tablet:bg-transparent max-tablet:text-xs', index === 0 && 'tablet:bg-primary tablet:text-primary-foreground')}>{number}</span>
                <div className='flex min-h-36 min-w-0 flex-col justify-center px-6 py-5 max-tablet:min-h-20 max-tablet:pl-0 max-tablet:pr-4 max-tablet:py-4'>
                  <h2 className='text-xl font-semibold max-tablet:text-base'>{title}</h2>
                  <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className='mt-6 flex items-center justify-between gap-6 rounded-xl border border-warning/40 bg-warning-soft p-5 max-tablet:flex-col max-tablet:items-stretch' aria-label='Tournament entry'>
          <p className='text-sm leading-relaxed text-warning'>{entry.description}</p>
          <Link href={entry.href} className={cn(buttonVariants(), 'h-11 shrink-0 rounded-lg px-5 font-semibold')}>{entry.label}</Link>
        </section>
      </main>
    </div>
  );
}
