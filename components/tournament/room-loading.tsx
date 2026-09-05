import type { ReactNode } from 'react';

import { RiftClashMark } from '@/components/brand/rift-clash-logo';
import { cn } from '@/lib/utils';

type RoomLoadingProps = {
  organizer?: boolean;
};

const participantNavigation = [
  'Overview',
  'Profile',
  'My team',
  'Browse teams',
  'Announcements',
];

const organizerNavigation = [
  'Overview',
  'Tier review',
  'Teams',
  'Announcements',
  'Settings',
];

function LoadingBar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden='true'
      className={cn('room-loading-sheen block rounded-md bg-secondary', className)}
    />
  );
}

function LoadingPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden='true'
      className={cn('rounded-card border border-border bg-card', className)}
    >
      {children}
    </div>
  );
}

export function RoomLoading({ organizer = false }: RoomLoadingProps) {
  const label = organizer
    ? 'Loading organizer control room'
    : 'Loading tournament room';
  const navigation = organizer ? organizerNavigation : participantNavigation;

  return (
    <main
      aria-busy='true'
      aria-label={label}
      className='min-h-[100dvh] bg-background text-foreground'
    >
      <span className='sr-only' role='status'>
        {label}
      </span>

      <aside
        aria-hidden='true'
        className='fixed inset-y-0 left-0 z-40 hidden w-[244px] flex-col border-r border-white/10 bg-shell-sidebar px-[18px] py-7 text-shell-sidebar-foreground desktop:flex'
      >
        <div className='px-1'>
          <div className='flex min-h-11 items-center gap-2.5'>
            <RiftClashMark className='size-7 shrink-0' />
            <span className='flex min-w-0 flex-col leading-none'>
              <span className='font-display text-[15px] font-bold tracking-[0.02em]'>
                RIFT CLASH
              </span>
              <span className='mt-1 font-mono text-[9px] font-medium tracking-[0.1em] opacity-55'>
                {organizer ? 'ORGANIZER ROOM' : 'PRIVATE WILD RIFT'}
              </span>
            </span>
          </div>
        </div>

        <div className='mt-5 border-t border-white/10 pt-6'>
          <p className='m-0 px-3 font-mono text-[9px] font-semibold tracking-[0.2em] text-shell-sidebar-muted'>
            {organizer ? 'CONTROL ROOM' : 'TOURNAMENT'}
          </p>
          <div className='mt-4 flex flex-col gap-1'>
            {navigation.map((item, index) => (
              <div
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3',
                  index === 0 && 'bg-white/9',
                )}
                key={item}
              >
                <span
                  className={cn(
                    'size-[17px] shrink-0 rounded-md bg-white/10',
                    index === 0 && 'bg-primary/35',
                  )}
                />
                <LoadingBar
                  className={cn(
                    'h-3 bg-white/10',
                    index === 0 ? 'w-20 bg-white/18' : 'w-24',
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <div className='mt-auto flex flex-col gap-4'>
          <div className='rounded-xl border border-white/10 bg-white/4 p-3.5'>
            <LoadingBar className='h-2.5 w-20 bg-white/10' />
            <LoadingBar className='mt-3 h-4 w-14 bg-primary/30' />
            <LoadingBar className='mt-2 h-2.5 w-24 bg-white/10' />
          </div>
          <div className='flex items-center gap-3 border-t border-white/10 pt-4'>
            <span className='size-9 shrink-0 rounded-full bg-white/10' />
            <div className='min-w-0 flex-1'>
              <LoadingBar className='h-3 w-20 bg-white/14' />
              <LoadingBar className='mt-2 h-2 w-28 bg-white/10' />
            </div>
          </div>
        </div>
      </aside>

      <div className='desktop:ml-[244px]'>
        <header className='border-b border-border bg-background/94 backdrop-blur-xl'>
          <div className='flex min-h-[76px] items-center gap-4 px-[18px] desktop:min-h-[78px] desktop:px-[34px]'>
            <div className='flex min-w-0 items-center gap-2.5 desktop:hidden'>
              <RiftClashMark className='size-7 shrink-0' />
              <span className='flex min-w-0 flex-col leading-none'>
                <span className='font-display text-[15px] font-bold tracking-[0.02em]'>
                  RIFT CLASH
                </span>
                <span className='mt-1 font-mono text-[9px] font-medium tracking-[0.1em] text-muted-foreground'>
                  {organizer ? 'ORGANIZER ROOM' : 'PRIVATE WILD RIFT'}
                </span>
              </span>
            </div>

            <div className='hidden items-center gap-2 desktop:flex' aria-hidden='true'>
              <LoadingBar className='h-2.5 w-20' />
              <span className='font-mono text-[10px] text-muted-foreground'>/</span>
              <LoadingBar className='h-2.5 w-24' />
            </div>

            <div aria-hidden='true' className='ml-auto flex items-center gap-2'>
              <LoadingBar className='hidden h-7 w-24 rounded-full desktop:block' />
              <LoadingBar className='hidden h-7 w-24 rounded-full desktop:block' />
              <LoadingBar className='hidden h-7 w-16 rounded-full desktop:block' />
              <span className='hidden size-9 rounded-full bg-primary/30 desktop:block' />
              <span className='grid size-10 place-items-center rounded-lg border border-border bg-secondary desktop:hidden'>
                <span className='grid gap-1'>
                  <span className='h-px w-3 bg-muted-foreground/70' />
                  <span className='h-px w-3 bg-muted-foreground/70' />
                </span>
              </span>
            </div>
          </div>
        </header>

        <div className='w-full px-[18px] py-[22px] desktop:px-[34px] desktop:py-7'>
          <div className='mx-auto grid w-full max-w-page gap-5'>
            <LoadingPanel className='border-primary/25 bg-card p-5 desktop:p-6'>
              <div className='flex items-center gap-4'>
                <div className='grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft'>
                  <RiftClashMark className='size-7' />
                </div>
                <div className='min-w-0'>
                  <p className='m-0 font-mono text-2xs font-semibold tracking-[0.16em] text-primary-muted'>
                    {organizer ? 'CONTROL ROOM' : 'TOURNAMENT ROOM'}
                  </p>
                  <h1 className='mt-1 mb-0 truncate font-display text-xl font-bold tracking-[-0.025em] desktop:text-2xl'>
                    Getting the room ready
                  </h1>
                  <p className='mt-1.5 mb-0 text-sm text-muted-foreground'>
                    Syncing your roster, registration, and latest updates.
                  </p>
                </div>
              </div>
              <div className='mt-6 flex items-center gap-3'>
                <div className='h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary'>
                  <span className='room-loading-sheen block h-full w-2/5 rounded-full bg-primary' />
                </div>
                <span className='shrink-0 font-mono text-2xs font-semibold tracking-[0.12em] text-primary-muted'>
                  LOADING
                </span>
              </div>
            </LoadingPanel>

            <div className='grid items-start gap-[18px] desktop:grid-cols-[minmax(0,1fr)_280px]'>
              <div className='grid gap-4'>
                <LoadingPanel className='p-5 desktop:p-6'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0 flex-1'>
                      <LoadingBar className='h-2.5 w-20' />
                      <LoadingBar className='mt-4 h-8 w-2/5 max-w-60' />
                      <LoadingBar className='mt-2.5 h-3 w-44' />
                    </div>
                    <div className='shrink-0 text-right'>
                      <LoadingBar className='ml-auto h-2.5 w-16' />
                      <LoadingBar className='mt-3 ml-auto h-7 w-12' />
                    </div>
                  </div>
                  <div className='mt-5 grid grid-cols-2 gap-2 tablet:grid-cols-3 desktop:grid-cols-5'>
                    {Array.from({ length: 5 }, (_, index) => (
                      <div
                        className='rounded-xl border border-border bg-secondary/55 p-3'
                        key={index}
                      >
                        <div className='flex items-center justify-between gap-2'>
                          <span className='size-4 rounded-md bg-primary/25' />
                          <LoadingBar className='h-2 w-10' />
                        </div>
                        <LoadingBar className='mt-5 h-8 w-8 rounded-full' />
                        <LoadingBar className='mt-3 h-3 w-16' />
                        <LoadingBar className='mt-2 h-2.5 w-20' />
                      </div>
                    ))}
                  </div>
                  <div className='mt-5 flex flex-wrap items-center justify-between gap-3'>
                    <LoadingBar className='h-3 w-24 bg-primary/25' />
                    <div className='flex gap-2'>
                      <LoadingBar className='h-10 w-32 rounded-xl' />
                      <LoadingBar className='h-10 w-28 rounded-xl' />
                    </div>
                  </div>
                </LoadingPanel>

                <LoadingPanel className='flex items-center justify-between gap-4 p-5'>
                  <div className='min-w-0 flex-1'>
                    <LoadingBar className='h-2.5 w-20' />
                    <LoadingBar className='mt-3 h-4 w-56 max-w-full' />
                  </div>
                  <div className='hidden gap-2 tablet:flex'>
                    <LoadingBar className='h-8 w-24 rounded-full' />
                    <LoadingBar className='h-8 w-24 rounded-full' />
                    <LoadingBar className='h-8 w-24 rounded-full' />
                  </div>
                </LoadingPanel>
              </div>

              <aside className='grid gap-4'>
                <LoadingPanel className='p-5'>
                  <LoadingBar className='h-2.5 w-24' />
                  <LoadingBar className='mt-4 h-5 w-40' />
                  <LoadingBar className='mt-4 h-2.5 w-full' />
                  <LoadingBar className='mt-2.5 h-2.5 w-4/5' />
                  <LoadingBar className='mt-5 h-10 w-full rounded-xl' />
                </LoadingPanel>
                <LoadingPanel className='p-5'>
                  <LoadingBar className='h-2.5 w-28' />
                  <LoadingBar className='mt-4 h-4 w-full' />
                  <LoadingBar className='mt-2.5 h-4 w-4/5' />
                  <LoadingBar className='mt-5 h-10 w-full rounded-xl' />
                </LoadingPanel>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
