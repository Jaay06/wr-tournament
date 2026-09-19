export const tiers = [
  {
    tier: 'T1',
    range: 'Sovereign to Challenger',
    detail: 'Organizer-approved. Maximum one in the starting lineup.',
    tone: 'gold',
  },
  {
    tier: 'T2',
    range: 'Grandmaster to Master',
    detail: 'High-ranked core. Maximum two in the starting lineup.',
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
  ['04', 'Build the five', 'Build a roster of at least six players. Choose five starters and keep the rest as substitutes.'],
  ['05', 'Get tier approval', 'Every roster member needs organizer approval before submission.'],
  ['06', 'Submit the roster', 'Submit a valid team before the registration deadline.'],
] as const;
