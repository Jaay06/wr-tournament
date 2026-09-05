import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';

import { auth } from '@/auth';
import { RiftClashLogo } from '@/components/brand/rift-clash-logo';
import { buttonVariants } from '@/components/ui/button';
import {
  tournamentEntryFor,
  type TournamentEntry,
} from '@/lib/tournament-entry';
import { cn } from '@/lib/utils';

type MarketingPage = 'overview' | 'tiers' | 'rules' | 'how-it-works';

type MarketingHeaderProps = {
  activePage: MarketingPage;
  entry?: TournamentEntry;
};

const navItems: readonly {
  label: string;
  href: string;
  page: MarketingPage;
}[] = [
  { label: 'Overview', href: '/', page: 'overview' },
  { label: 'How it works', href: '/how-it-works', page: 'how-it-works' },
  { label: 'Rules', href: '/rules', page: 'rules' },
  { label: 'Tiers', href: '/tiers', page: 'tiers' },
];

export async function MarketingHeader({
  activePage,
  entry,
}: MarketingHeaderProps) {
  const resolvedEntry = entry ?? tournamentEntryFor(await auth());

  return (
    <header className='border-b border-border bg-background/92'>
      <div className='mx-auto flex min-h-18.25 w-full max-w-page items-center gap-9 px-12 py-3.5 max-tablet:min-h-16 max-tablet:gap-3 max-tablet:px-5 max-phone:px-4'>
        <Link
          className='flex shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
          href='/#top'
          aria-label='Rift Clash home'
        >
          <RiftClashLogo className='h-12 w-auto max-phone:h-10' />
        </Link>

        <nav
          className='flex items-center gap-7 max-desktop:hidden'
          aria-label='Public navigation'
        >
          {navItems.map((item) => {
            const isActive = item.page === activePage;

            return (
              <Link
                className={cn(
                  'inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-secondary-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted',
                  isActive && 'font-semibold text-primary',
                )}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                key={item.label}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {activePage !== 'overview' ? (
          <Link
            className={cn(
              buttonVariants({ size: 'sm' }),
              'ml-auto min-h-11 rounded-lg bg-primary px-4.5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted max-tablet:px-3.5 max-tablet:text-xs max-phone:hidden',
            )}
            href={resolvedEntry.href}
          >
            {resolvedEntry.label}
            <ArrowRight aria-hidden='true' size={16} strokeWidth={1.8} />
          </Link>
        ) : (
          <span className='ml-auto max-desktop:hidden' />
        )}

        <details className='group relative hidden max-desktop:block max-phone:ml-auto'>
          <summary
            className='grid size-11 cursor-pointer list-none place-items-center rounded-xl border border-border bg-secondary text-foreground transition-colors hover:border-border-strong hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted [&::-webkit-details-marker]:hidden'
            aria-label='Public navigation'
          >
            <Menu
              aria-hidden='true'
              className='group-open:hidden'
              size={20}
              strokeWidth={1.8}
            />
            <X
              aria-hidden='true'
              className='hidden group-open:block'
              size={20}
              strokeWidth={1.8}
            />
          </summary>
          <div className='absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-card border border-border bg-card p-2 shadow-2xl shadow-background/60'>
            <nav className='flex flex-col gap-1' aria-label='Mobile public navigation'>
              {navItems.map((item) => {
                const isActive = item.page === activePage;

                return (
                  <Link
                    className={cn(
                      'flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-muted',
                      isActive && 'bg-primary-soft text-primary-muted',
                    )}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    key={item.label}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {activePage !== 'overview' ? (
                <Link
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'mt-1 min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover phone:hidden',
                  )}
                  href={resolvedEntry.href}
                >
                  {resolvedEntry.label}
                  <ArrowRight aria-hidden='true' size={16} strokeWidth={1.8} />
                </Link>
              ) : null}
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
