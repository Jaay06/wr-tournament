export const tiers = [
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

export const accessSteps = [
  ['01', 'Sign in', 'Use Discord or your email and password.'],
  ['02', 'Enter the invite', 'Use the private code from the organizer.'],
  ['03', 'Register', 'Add your Riot ID, tier, and preferred roles.'],
] as const;

export const howItWorksSteps = [
  ['01', 'Sign in', 'Use Discord or your email and password.'],
  ['02', 'Enter the invite', 'Use the private code from the organizer.'],
  ['03', 'Register', 'Add your Riot ID, tier, and preferred roles.'],
  ['04', 'Get approved', 'The organizer confirms the tier used for your roster.'],
  ['05', 'Form a team', 'Build five starters and add optional substitutes.'],
  ['06', 'Submit the roster', 'Submit a valid team before the registration deadline.'],
] as const;
