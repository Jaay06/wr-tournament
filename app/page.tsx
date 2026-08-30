const tiers = [
  {
    tier: 'T1',
    range: 'Sovereign to Challenger',
    detail: 'Organizer-approved. Maximum one across the full roster.',
    tone: 'gold',
  },
  {
    tier: 'T2',
    range: 'Grandmaster to Master',
    detail: 'High-ranked core. Maximum two across the full roster.',
    tone: 'silver',
  },
  {
    tier: 'T3',
    range: 'Diamond',
    detail: 'No tier cap. Build around the roles your team needs.',
    tone: 'bronze',
  },
  {
    tier: 'T4',
    range: 'Emerald and below',
    detail: 'No tier cap. Every submitted player still needs approval.',
    tone: 'grey',
  },
] as const;

const accessSteps = [
  ['01', 'Sign in', 'Use Discord or your email and password.'],
  ['02', 'Enter the invite', 'Use the private code from the organizer.'],
  ['03', 'Register', 'Add your Riot ID, tier, and preferred roles.'],
] as const;

const teamRules = [
  ['5-7', 'Five starters', 'Add up to two substitutes.'],
  ['T1', 'Maximum one T1', 'The cap covers starters and substitutes.'],
  ['T2', 'Maximum two T2', 'T3 and T4 have no roster cap.'],
] as const;

type TierTone = (typeof tiers)[number]['tone'];

const tierCardTones: Record<TierTone, string> = {
  gold: 'border-l-tier-t1',
  silver: 'border-l-tier-t2',
  bronze: 'border-l-tier-t3',
  grey: 'border-l-tier-t4',
};

const tierBadgeTones: Record<TierTone, string> = {
  gold: 'bg-tier-t1/10 text-tier-t1',
  silver: 'bg-tier-t2/10 text-tier-t2',
  bronze: 'bg-tier-t3/10 text-tier-t3',
  grey: 'bg-tier-t4/10 text-tier-t4',
};

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

function CheckIcon() {
  return (
    <svg aria-hidden='true' viewBox='0 0 12 12' width='12' height='12'>
      <path
        d='m3 6 2 2 4-4'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.4'
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div
      className='min-h-svh overflow-hidden bg-background text-foreground'
      id='top'
    >
      <header className='border-b border-border bg-background/92'>
        <div className='mx-auto flex min-h-18.25 w-full max-w-page items-center gap-9 px-12 py-4.5 max-tablet:min-h-16 max-tablet:px-5 max-tablet:py-3.5'>
          <a
            className='flex shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
            href='#top'
            aria-label='Rift Clash home'
          >
            <span className='grid size-9 shrink-0 place-items-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground'>
              WR
            </span>
            <span className='flex flex-col'>
              <strong className='text-base font-bold leading-4.5 tracking-[-0.02em]'>
                RIFT CLASH
              </strong>
              <small className='font-mono text-3xs leading-3.25 tracking-[0.12em] text-muted-foreground max-phone:hidden'>
                PRIVATE WILD RIFT TOURNAMENT
              </small>
            </span>
          </a>

          <nav className='flex items-center gap-7 max-desktop:hidden' aria-label='Homepage'>
            <a
              className='border-b-2 border-primary pb-1.25 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
              href='#top'
            >
              Overview
            </a>
            <a
              className='text-sm font-medium text-secondary-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
              href='#tiers'
            >
              Tiers
            </a>
            <a
              className='text-sm font-medium text-secondary-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
              href='#rules'
            >
              Rules
            </a>
            <a
              className='text-sm font-medium text-secondary-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
              href='#how-it-works'
            >
              How it works
            </a>
          </nav>

          <a
            className='ml-auto inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-primary px-4.5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted max-tablet:px-3.5 max-tablet:text-xs'
            href='/signin?callbackUrl=%2Finvite'
          >
            Enter tournament
            <ArrowIcon />
          </a>
        </div>
      </header>

      <main>
        <section
          className='mx-auto grid w-full max-w-page grid-cols-[minmax(0,1fr)_420px] items-center gap-16 px-12 py-18 pb-16 max-desktop:grid-cols-[minmax(0,1fr)_380px] max-desktop:gap-9 max-tablet:grid-cols-1 max-tablet:gap-8 max-tablet:px-5 max-tablet:py-10.5 max-tablet:pb-9.5'
          aria-labelledby='hero-title'
        >
          <div className='max-w-hero max-tablet:max-w-none'>
            <p className='m-0 flex items-center gap-2.5 font-mono text-xs font-semibold tracking-[0.13em] text-success max-phone:text-3xs'>
              <span className='size-1.75 shrink-0 rounded-full bg-success shadow-sm shadow-success/60' aria-hidden='true' />
              PRIVATE TOURNAMENT · INVITE ONLY
            </p>

            <div className='mt-6.5 max-phone:mt-5.5'>
              <h1
                className='m-0 font-display text-[clamp(64px,7vw,96px)] font-extrabold leading-[0.84] tracking-[-0.055em] text-primary max-tablet:text-[clamp(58px,18vw,82px)]'
                id='hero-title'
              >
                RIFT
                <br />
                CLASH
              </h1>
              <p className='mt-7 max-w-copy text-lg leading-[1.6] text-secondary-foreground max-phone:mt-5.5 max-phone:text-base max-phone:leading-normal'>
                A simple place for friends to register, settle tiers, form teams,
                and get into the game.
              </p>
            </div>

            <div className='mt-7 flex flex-wrap items-center gap-3.5 max-phone:grid max-phone:grid-cols-1'>
              <a
                className='inline-flex min-h-12.5 items-center justify-center gap-2.5 rounded-md bg-primary px-5.5 py-3.5 text-base font-bold text-primary-foreground shadow-xl shadow-primary/35 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted max-phone:w-full'
                href='/signin?callbackUrl=%2Finvite'
              >
                Enter tournament
                <ArrowIcon />
              </a>
              <a
                className='inline-flex min-h-12.5 items-center justify-center gap-2.5 rounded-md border border-border bg-secondary px-5.5 py-3.5 text-base font-bold text-foreground hover:border-border-strong hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted max-phone:w-full'
                href='#rules'
              >
                View team rules
              </a>
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

          <aside
            className='overflow-hidden rounded-card border border-border bg-card shadow-2xl shadow-background/40'
            id='private-access'
          >
            <div className='flex items-center justify-between px-5.5 pt-5 font-mono text-2xs font-semibold tracking-[0.12em] text-muted-foreground'>
              <span>PRIVATE ACCESS</span>
              <span className='inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/15 px-2 py-1 font-mono text-2xs tracking-[0.04em] text-primary-muted'>
                <i className='size-1.5 rounded-full bg-primary' aria-hidden='true' />
                INVITE REQUIRED
              </span>
            </div>

            <h2 className='mt-5.5 px-5.5 font-display text-2xl font-bold leading-[1.15]'>
              Have the invite?
            </h2>
            <p className='mx-5.5 mb-5 mt-2 text-sm leading-[1.55] text-secondary-foreground'>
              Sign in first, then use the link or code your organizer shared.
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
                    <strong className='text-sm leading-4.5 text-foreground'>{title}</strong>
                    <small className='text-xs leading-4.25 text-muted-foreground'>{description}</small>
                  </span>
                </li>
              ))}
            </ol>

            <div className='flex items-center gap-3 border-t border-border bg-background px-5.5 py-3.5 text-xs text-muted-foreground max-phone:flex-col max-phone:items-start'>
              <span>Private tournament data stays behind sign-in.</span>
              <a
                className='ml-auto inline-flex items-center gap-1.25 whitespace-nowrap font-semibold text-primary-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted max-phone:ml-0'
                href='/signin?callbackUrl=%2Finvite'
              >
                Sign in to continue
                <ArrowIcon />
              </a>
            </div>
          </aside>
        </section>

        <section
          className='mx-auto grid w-full max-w-page grid-cols-[minmax(0,1fr)_380px] items-start gap-6 px-12 pb-14 pt-6 max-desktop:grid-cols-1 max-tablet:px-5 max-tablet:pb-10.5 max-tablet:pt-7'
        >
          <div className='min-w-0' id='tiers'>
            <div className='mb-4 flex items-end justify-between gap-5 max-phone:items-start max-phone:flex-col max-phone:gap-2'>
              <div>
                <p className='mb-1.25 font-mono text-3xs tracking-[0.13em] text-primary-muted'>
                  TEAM BALANCE
                </p>
                <h2 className='m-0 font-display text-xl font-bold leading-7'>Tier system</h2>
              </div>
              <span className='font-mono text-2xs tracking-widest text-muted-foreground'>
                SELF-ASSESS · ORGANIZER REVIEW
              </span>
            </div>

            <div className='grid grid-cols-2 gap-3.5 max-tablet:grid-cols-1'>
              {tiers.map((tier) => (
                <article
                  className={[
                    'flex min-h-28 items-start gap-3.5 rounded-xl border border-border border-l-3 bg-card p-4.5',
                    tierCardTones[tier.tone],
                  ].join(' ')}
                  key={tier.tier}
                >
                  <span
                    className={[
                      'grid size-11 shrink-0 place-items-center rounded-lg border border-current font-display text-sm font-extrabold',
                      tierBadgeTones[tier.tone],
                    ].join(' ')}
                  >
                    {tier.tier}
                  </span>
                  <div>
                    <h3 className='mb-1.25 mt-px text-sm font-bold leading-4.5'>{tier.range}</h3>
                    <p className='m-0 text-xs leading-[1.45] text-secondary-foreground'>{tier.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            <div
              className='mt-3.5 grid grid-cols-3 gap-3 max-tablet:grid-cols-1'
              id='how-it-works'
            >
              <article className='flex min-h-17.5 items-center gap-2.75 rounded-xl border border-border bg-card p-3.5'>
                <span className='grid size-8 shrink-0 place-items-center rounded-lg border border-primary bg-primary font-mono text-xs font-bold text-primary-foreground'>
                  1
                </span>
                <div className='flex min-w-0 flex-col gap-0.75'>
                  <strong className='text-sm leading-4.5'>Register</strong>
                  <small className='text-xs leading-4.25 text-muted-foreground'>Add Riot ID, rank, tier, and roles.</small>
                </div>
              </article>
              <article className='flex min-h-17.5 items-center gap-2.75 rounded-xl border border-border bg-card p-3.5'>
                <span className='grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary font-mono text-xs font-bold text-secondary-foreground'>
                  2
                </span>
                <div className='flex min-w-0 flex-col gap-0.75'>
                  <strong className='text-sm leading-4.5'>Get approved</strong>
                  <small className='text-xs leading-4.25 text-muted-foreground'>The organizer confirms your tier.</small>
                </div>
              </article>
              <article className='flex min-h-17.5 items-center gap-2.75 rounded-xl border border-border bg-card p-3.5'>
                <span className='grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary font-mono text-xs font-bold text-secondary-foreground'>
                  3
                </span>
                <div className='flex min-w-0 flex-col gap-0.75'>
                  <strong className='text-sm leading-4.5'>Form a team</strong>
                  <small className='text-xs leading-4.25 text-muted-foreground'>Build five starters and optional subs.</small>
                </div>
              </article>
            </div>
          </div>

          <aside className='overflow-hidden rounded-2xl border border-border bg-card' id='rules'>
            <div className='flex items-center gap-2.5 border-b border-border bg-linear-to-r from-secondary to-card px-4.5 py-4'>
              <span className='grid size-7.5 shrink-0 place-items-center rounded-lg bg-primary text-lg text-primary-foreground' aria-hidden='true'>
                ◇
              </span>
              <h2 className='m-0 font-display text-base font-bold leading-5'>Team rules</h2>
              <span className='ml-auto rounded-full bg-primary/15 px-2 py-1 font-mono text-3xs font-semibold text-primary-muted'>
                ENFORCED
              </span>
            </div>

            <ul className='m-0 list-none p-0'>
              {teamRules.map(([badge, title, description], index) => (
                <li
                  className='flex min-h-18.5 items-center gap-3.5 border-b border-border px-4.5 py-4'
                  key={badge}
                >
                  <span
                    className={[
                      'grid h-9 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background font-mono text-xs font-bold',
                      index === 1 ? 'border-tier-t1/20 bg-tier-t1/10 text-tier-t1' : '',
                      index === 2 ? 'border-tier-t2/20 bg-tier-t2/10 text-tier-t2' : 'text-tier-t1',
                    ].join(' ')}
                  >
                    {badge}
                  </span>
                  <span className='flex min-w-0 flex-col gap-0.75'>
                    <strong className='text-sm leading-4.5'>{title}</strong>
                    <small className='text-xs leading-4.25 text-muted-foreground'>{description}</small>
                  </span>
                  <span className='ml-auto grid size-5.5 shrink-0 place-items-center rounded-full bg-success/15 text-success'>
                    <CheckIcon />
                  </span>
                </li>
              ))}
            </ul>

            <div className='flex items-center justify-between gap-3 bg-background px-4.5 py-3 text-2xs text-muted-foreground max-phone:items-start max-phone:flex-col'>
              <span className='inline-flex items-center gap-1.5 font-mono text-secondary-foreground'>
                <i className='size-1.5 rounded-full bg-success' aria-hidden='true' />
                ROSTER VALIDATION
              </span>
              <span>Role coverage warns, but does not block.</span>
            </div>
          </aside>
        </section>
      </main>

      <footer className='mx-auto flex w-full max-w-page items-center justify-between gap-6 border-t border-border px-12 py-5.5 font-mono text-2xs tracking-[0.04em] text-muted-foreground max-tablet:items-start max-tablet:flex-col max-tablet:gap-2 max-tablet:px-5 max-tablet:py-5'>
        <span>Rift Clash · A private tournament for friends</span>
        <span>Match days stay in Discord</span>
      </footer>
    </div>
  );
}
