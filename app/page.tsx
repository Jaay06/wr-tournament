import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { auth } from '@/auth';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { accessSteps } from '@/lib/marketing-content';
import { tournamentEntryFor } from '@/lib/tournament-entry';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export default async function Home() {
  const session = await auth();
  const entry = tournamentEntryFor(session);
  const showInviteCodeEntry = !session?.user?.hasJoinedTournament;

  return (
    <div className='min-h-[100dvh] bg-background text-foreground' id='top'>
      <MarketingHeader activePage='overview' entry={entry} />
      <main className='mx-auto w-full max-w-page px-12 pb-12 max-tablet:px-5'>
        <section
          className='grid grid-cols-2 items-center gap-16 py-16 max-tablet:grid-cols-1 max-tablet:gap-7 max-tablet:py-9'
          aria-labelledby='hero-title'
        >
          <div>
            <p className='font-mono text-[10px] font-semibold tracking-[0.2em] text-primary'>
              PRIVATE TOURNAMENT / INVITE ONLY
            </p>
            <h1
              id='hero-title'
              className='mt-6 max-w-[520px] font-display text-[clamp(2.875rem,5vw,4.25rem)] font-bold leading-[1.03] tracking-[-0.045em]'
            >
              Your five is waiting.
            </h1>
            <p className='mt-6 max-w-lg text-lg leading-relaxed text-secondary-foreground max-tablet:text-base'>
              Register, settle your tier, and build your team with friends.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link
                className={cn(
                  buttonVariants(),
                  'h-12 rounded-lg px-5 text-sm font-semibold max-phone:flex-1',
                )}
                href={entry.href}
              >
                {entry.label}
                <ArrowUpRight aria-hidden='true' size={18} />
              </Link>
              <Link
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'h-12 rounded-lg px-5 text-sm font-semibold',
                )}
                href='/rules'
              >
                View team rules
              </Link>
            </div>
          </div>
          <figure className='min-w-0'>
            <Image
              src='/wild-rift-battlefield.jpg'
              alt='Wild Rift battlefield with both bases, three lanes, jungle and river.'
              width={1920}
              height={1080}
              sizes='(max-width: 900px) calc(100vw - 40px), (max-width: 1440px) 45vw, 620px'
              loading='eager'
              fetchPriority='high'
              className='aspect-video w-full rounded-2xl border border-border object-cover'
            />
            <figcaption className='mt-4 font-mono text-[10px] tracking-widest text-muted-foreground'>
              WILD RIFT / FULL BATTLEFIELD
            </figcaption>
          </figure>
        </section>

        <section
          id='private-access'
          aria-labelledby='private-access-title'
          className='overflow-hidden rounded-2xl border border-border bg-card'
        >
          <div className='grid grid-cols-[1fr_3fr] max-tablet:grid-cols-1'>
            <div className='border-r border-border p-7 max-tablet:border-r-0 max-tablet:border-b max-tablet:p-5'>
              <p className='font-mono text-[10px] tracking-[0.2em] text-primary'>
                PRIVATE ACCESS
              </p>
              <h2
                id='private-access-title'
                className='mt-3 text-xl font-semibold'
              >
                {entry.title}
              </h2>
              <p className='mt-2 text-sm leading-relaxed text-secondary-foreground'>
                {entry.description}
              </p>
            </div>
            <ol className='grid grid-cols-3 items-center px-6 py-8 max-tablet:grid-cols-1 max-tablet:p-0'>
              {accessSteps.map(([number, title, description]) => (
                <li
                  key={number}
                  className='flex h-full gap-4 border-r border-border px-6 last:border-0 max-tablet:border-r-0 max-tablet:border-b max-tablet:p-5'
                >
                  <span className='pt-1 font-mono text-[10px] text-primary'>
                    {number}
                  </span>
                  <div>
                    <h3 className='font-semibold'>{title}</h3>
                    <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {showInviteCodeEntry && (
            <form
              action='/invite'
              method='get'
              className='flex items-end gap-4 border-t border-border p-5 max-phone:flex-col max-phone:items-stretch'
            >
              <div className='min-w-0 flex-1'>
                <label
                  htmlFor='landing-invite-code'
                  className='text-sm font-semibold'
                >
                  Have an invite code?
                </label>
                <p
                  id='landing-invite-code-help'
                  className='mt-1 text-sm text-muted-foreground'
                >
                  Enter the 4-digit code from the organizer.
                </p>
                <Input
                  id='landing-invite-code'
                  aria-describedby='landing-invite-code-help'
                  autoComplete='one-time-code'
                  inputMode='numeric'
                  maxLength={4}
                  name='code'
                  pattern='[0-9]{4}'
                  placeholder='1234'
                  required
                  spellCheck={false}
                  className='mt-3 h-12 rounded-lg bg-background font-mono tracking-widest'
                />
              </div>
              <button
                type='submit'
                className={cn(buttonVariants(), 'h-12 rounded-lg px-5')}
              >
                Use code
                <ArrowUpRight aria-hidden='true' size={18} />
              </button>
            </form>
          )}
          <p className='border-t border-border px-5 py-3 text-xs text-muted-foreground'>
            {entry.status}
          </p>
        </section>
      </main>
    </div>
  );
}
