'use client';

import { Button } from '@/components/ui/button';

export default function FixturesError({ retry }: { retry: () => void }) {
  return (
    <section className='mx-auto w-full max-w-xl px-5 py-16' aria-labelledby='fixtures-error-title'>
      <h1 id='fixtures-error-title' className='font-display text-3xl font-semibold text-foreground'>Fixtures couldn’t load</h1>
      <p role='alert' className='mt-3 text-muted-foreground'>Your results have not changed. Try loading the schedule again.</p>
      <Button className='mt-6 min-h-11' onClick={retry}>Try again</Button>
    </section>
  );
}
