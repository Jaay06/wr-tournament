import Link from 'next/link';

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
  { label: 'Tiers', href: '/tiers', page: 'tiers' },
  { label: 'Rules', href: '/rules', page: 'rules' },
  { label: 'How it works', href: '/how-it-works', page: 'how-it-works' },
];

export async function MarketingHeader({
  activePage,
  entry,
}: MarketingHeaderProps) {
  const resolvedEntry = entry ?? tournamentEntryFor(await auth());

  return (
    <header className='border-b border-border bg-background/92'>
      <div className='mx-auto flex min-h-18.25 w-full max-w-page items-center gap-9 px-12 py-4.5 max-tablet:min-h-16 max-tablet:px-5 max-tablet:py-3.5'>
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
                  'text-sm font-medium text-secondary-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted',
                  isActive &&
                    'border-b-2 border-primary pb-1.25 font-semibold text-foreground',
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

        <Link
          className={cn(
            buttonVariants({ size: 'sm' }),
            'ml-auto min-h-9 rounded-full bg-primary px-4.5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted max-tablet:px-3.5 max-tablet:text-xs',
          )}
          href={resolvedEntry.href}
        >
          {resolvedEntry.label}
          <ArrowIcon />
        </Link>
      </div>
    </header>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden='true' viewBox='0 0 16 16' width='16' height='16'>
      <path
        d='M5 8h6m0 0L8 5m3 3-3 3'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.6'
      />
    </svg>
  );
}
