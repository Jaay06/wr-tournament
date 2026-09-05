'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */

import Link from 'next/link';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useDragControls,
  useReducedMotion,
} from 'motion/react';
import type {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { useActionState } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  GripVertical,
  Info,
  LockKeyhole,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Swords,
  Trash2,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RoleIcon } from '@/components/tournament/role-icon';
import {
  arrangeLineupAssignments,
  availableTournamentParticipants,
  participantTeamExitMode,
  reconcileLineupAssignments,
  type LineupAssignment,
  type LineupDropTarget,
  validateRoster,
} from '@/lib/tournament-rules';
import { cn } from '@/lib/utils';
import {
  Avatar,
  ButtonLink,
  Card,
  DeadlineBanner,
  FormSubmitButton,
  Kicker,
  PageFrame,
  RoleLabel,
  RolePreference,
  RoleValue,
  SectionHeading,
  StatusPill,
  TierBadge,
  defaultSettings,
  easeOutExpo,
  lineupDropTargetAtPoint,
  playerFromMember,
  previewTeam,
  previewTeamDetails,
  rosterPlayers,
  starterSlots,
  stateSwapTransition,
  teamCards,
  tierMeta,
} from './tournament-app-shared';
import type { Player, Role, Tier, TournamentAppProps } from './tournament-app-shared';
import { TournamentAppRouteFrame } from './tournament-app-route-frame';
import type {
  OrganizerOverviewData,
  TierReviewData,
  TournamentAnnouncementData,
  TournamentDashboardData,
  TournamentIncomingInviteData,
  TournamentMemberData,
  TournamentParticipantOption,
  TournamentPlayerProfileData,
  TournamentRegistrationData,
  TournamentTeamData,
  TournamentTeamDetailData,
  TournamentTeamSummary,
} from '@/lib/tournament-types';

import {
  savePlayerRegistration,
  type TournamentActionState,
} from '@/app/tournament/actions';

function RegistrationView({
  tournamentName,
  region,
  deadline,
  deadlineRemaining,
  deadlineStatus,
  registration,
}: {
  tournamentName: string;
  region: string;
  deadline: string;
  deadlineRemaining?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  registration?: TournamentRegistrationData | null;
}) {
  const previewRegistration: TournamentRegistrationData = {
    id: 'preview-registration',
    riotName: 'Jinxed',
    riotTag: '0420',
    currentRank: 'Diamond IV',
    selfAssessedTier: 'T3',
    approvedTier: null,
    tierStatus: 'pending',
    primaryRole: 'Mid',
    secondaryRole: 'Support',
  };
  const initial =
    registration === undefined ? previewRegistration : registration;
  const [selectedTier, setSelectedTier] = useState<Tier>(
    initial?.selfAssessedTier ?? 'T3',
  );
  const [primaryRole, setPrimaryRole] = useState<Role>(
    initial?.primaryRole ?? 'Mid',
  );
  const [secondaryRole, setSecondaryRole] = useState<Role>(
    initial?.secondaryRole ?? 'Support',
  );
  const [editing, setEditing] = useState(false);
  const [submittedValues, setSubmittedValues] =
    useState<TournamentRegistrationData | null>(null);
  const [state, formAction] = useActionState<TournamentActionState, FormData>(
    savePlayerRegistration,
    {},
  );
  const submitted = Boolean(state.success && !editing);
  const summary = state.registration ?? submittedValues ?? initial;

  function captureSubmission(event: FormEvent<HTMLFormElement>) {
    if (deadlineStatus === 'passed') {
      event.preventDefault();
      return;
    }

    const data = new FormData(event.currentTarget);
    const riotName = String(data.get('riotName') ?? '').trim();
    const riotTag = String(data.get('riotTag') ?? '').trim();
    const currentRank = String(data.get('currentRank') ?? '').trim();
    setSubmittedValues({
      id: initial?.id ?? 'pending-registration',
      riotName,
      riotTag,
      currentRank,
      selfAssessedTier: selectedTier,
      approvedTier: null,
      tierStatus: 'pending',
      primaryRole,
      secondaryRole,
    });
    setEditing(false);
  }

  if (submitted) {
    return (
      <PageFrame>
        <div className='mx-auto flex max-w-2xl flex-col gap-5'>
          <DeadlineBanner
            deadline={deadline}
            remaining={deadlineRemaining}
            status={deadlineStatus}
          />
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            initial={{ opacity: 0, transform: 'translateY(8px) scale(0.99)' }}
            transition={{ duration: 0.22, ease: easeOutExpo }}
          >
            <Card className='p-6 text-center desktop:p-10' aria-live='polite'>
              <span
                className={cn(
                  'mx-auto grid size-14 place-items-center rounded-2xl',
                  summary?.tierStatus === 'approved'
                    ? 'bg-success-soft text-success'
                    : 'bg-warning-soft text-warning',
                )}
              >
                {summary?.tierStatus === 'approved' ? (
                  <CheckCircle2 size={26} />
                ) : (
                  <Clock3 size={26} />
                )}
              </span>
              <div className='mt-4'>
                <StatusPill
                  tone={
                    summary?.tierStatus === 'approved' ? 'success' : 'warning'
                  }
                >
                  {summary?.tierStatus === 'approved'
                    ? `${summary.approvedTier} APPROVED`
                    : 'PENDING REVIEW'}
                </StatusPill>
              </div>
              <h1 className='mt-5 font-display text-3xl font-bold tracking-[-0.035em]'>
                {initial ? 'Profile updated' : 'Registration sent'}
              </h1>
              <p className='mx-auto mt-3 max-w-copy text-base leading-6 text-secondary-foreground'>
                {summary?.tierStatus === 'approved'
                  ? `Your ${summary.approvedTier} tier is still approved. You can start looking at teams now.`
                  : `The organizer will review your ${summary?.selfAssessedTier ?? 'selected'} self-assessment. You can start looking at teams now.`}
              </p>
              <div className='mt-6 grid gap-3 rounded-2xl border border-border bg-secondary p-4 text-left tablet:grid-cols-3'>
                <div>
                  <Kicker>RIOT ID</Kicker>
                  <p className='mt-2 text-sm font-semibold'>
                    {summary?.riotName}#{summary?.riotTag}
                  </p>
                </div>
                <div>
                  <Kicker>RANK</Kicker>
                  <p className='mt-2 text-sm font-semibold'>
                    {summary?.currentRank}
                  </p>
                </div>
                <div>
                  <Kicker>ROLES</Kicker>
                  {summary ? (
                    <RolePreference
                      className='mt-2 text-sm font-semibold'
                      primaryRole={summary.primaryRole}
                      secondaryRole={summary.secondaryRole}
                    />
                  ) : null}
                </div>
              </div>
              <div className='mt-6 flex flex-col justify-center gap-3 tablet:flex-row'>
                <ButtonLink href='/tournament'>
                  Go to participant home <ArrowRight size={16} />
                </ButtonLink>
                {deadlineStatus !== 'passed' ? (
                  <Button
                    className='min-h-11 border border-border bg-secondary text-foreground hover:border-border-strong'
                    onClick={() => setEditing(true)}
                    size='lg'
                    type='button'
                  >
                    Edit profile
                  </Button>
                ) : null}
              </div>
            </Card>
          </motion.div>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <div className='flex flex-col gap-7'>
        <div className='flex flex-wrap items-end justify-between gap-5'>
          <SectionHeading
            detail={`${tournamentName} · ${region}. The organizer confirms the tier used for team limits.`}
            eyebrow={initial ? 'PLAYER PROFILE' : 'PLAYER REGISTRATION'}
            title={
              initial ? 'Your player profile' : 'Create your player profile'
            }
          />
          <div className='flex flex-wrap gap-2'>
            <StatusPill tone={initial?.approvedTier ? 'success' : 'warning'}>
              {initial?.approvedTier
                ? `${initial.approvedTier} APPROVED`
                : 'PENDING REVIEW'}
            </StatusPill>
            <StatusPill
              tone={deadlineStatus === 'passed' ? 'danger' : 'warning'}
            >
              {deadlineStatus === 'passed'
                ? 'CLOSED'
                : (deadlineRemaining ?? 'OPEN')}
            </StatusPill>
          </div>
        </div>

        <div className='grid items-start gap-5 desktop:grid-cols-[minmax(0,1fr)_300px]'>
          <aside className='order-2 flex flex-col gap-5 desktop:sticky desktop:top-24'>
            <Card className='p-5'>
              <Kicker>ACCOUNT</Kicker>
              <div className='mt-4 flex items-center gap-3'>
                <Avatar
                  player={{
                    ...rosterPlayers[2],
                    name: initial?.riotName ?? 'Jinxed',
                    riotId: initial
                      ? `${initial.riotName}#${initial.riotTag}`
                      : 'Jinxed#0420',
                    initial: (initial?.riotName ?? 'J')
                      .slice(0, 1)
                      .toUpperCase(),
                  }}
                />
                <div className='min-w-0'>
                  <p className='m-0 truncate text-sm font-semibold'>
                    {initial
                      ? `${initial.riotName}#${initial.riotTag}`
                      : 'Signed-in player'}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Private tournament account
                  </p>
                </div>
              </div>
              <div className='mt-4 border-t border-border pt-4'>
                <StatusPill
                  tone={
                    initial?.tierStatus === 'approved' ? 'success' : 'warning'
                  }
                >
                  {initial?.tierStatus === 'approved'
                    ? 'APPROVED'
                    : 'AWAITING REVIEW'}
                </StatusPill>
              </div>
            </Card>
            <Card className='p-5'>
              <Kicker>WHAT HAPPENS NEXT</Kicker>
              <ol className='mt-4 flex list-none flex-col gap-4 p-0'>
                {[
                  'Complete your player details',
                  'Wait for organizer tier approval',
                  'Create or join a team',
                ].map((step, index) => (
                  <li className='flex items-start gap-3' key={step}>
                    <span className='grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-secondary font-mono text-2xs font-bold text-primary-muted'>
                      {index + 1}
                    </span>
                    <p className='m-0 pt-1 text-sm leading-5 text-secondary-foreground'>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
            <Card
              className={cn(
                'p-5',
                deadlineStatus === 'passed'
                  ? 'border-danger/25 bg-danger-soft'
                  : 'border-warning/25 bg-warning-soft/60',
              )}
            >
              <Kicker
                className={
                  deadlineStatus === 'passed' ? 'text-danger' : 'text-warning'
                }
              >
                {deadlineStatus === 'passed'
                  ? 'REGISTRATION CLOSED'
                  : 'REGISTRATION CLOSES'}
              </Kicker>
              <p className='mt-2 font-display text-lg font-bold'>{deadline}</p>
              <p className='mt-1 text-xs leading-5 text-secondary-foreground'>
                {deadlineStatus === 'passed'
                  ? 'Ask the organizer if you need an exception.'
                  : `${deadlineRemaining ?? 'Open'} · edits reopen tier review.`}
              </p>
            </Card>
          </aside>

          <form
            action={formAction}
            className='order-1 flex min-w-0 flex-col gap-5'
            onSubmit={captureSubmission}
          >
            <fieldset
              className='contents'
              disabled={deadlineStatus === 'passed'}
            >
              <Card className='p-5 desktop:p-6'>
                <div className='border-b border-border pb-5'>
                  <Kicker>PLAYER DETAILS</Kicker>
                  <h2 className='mt-2 font-display text-2xl font-bold'>
                    How should friends find you?
                  </h2>
                  <p className='mt-2 text-sm leading-5 text-secondary-foreground'>
                    Use the Riot ID and rank you play with today.
                  </p>
                </div>
                <FieldGroup className='mt-6 tablet:grid tablet:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor='riotName'>Riot name</FieldLabel>
                    <Input
                      className='min-h-12 rounded-xl px-3.5 text-base'
                      defaultValue={initial?.riotName ?? ''}
                      id='riotName'
                      name='riotName'
                      placeholder='Your Riot name'
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='riotTag'>Riot tag</FieldLabel>
                    <div className='relative'>
                      <span
                        aria-hidden='true'
                        className='pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base font-semibold text-muted-foreground'
                      >
                        #
                      </span>
                      <Input
                        className='min-h-12 rounded-xl pr-3.5 pl-7 text-base'
                        defaultValue={initial?.riotTag ?? ''}
                        id='riotTag'
                        name='riotTag'
                        placeholder='EUW'
                        required
                      />
                    </div>
                  </Field>
                  <Field className='tablet:col-span-2'>
                    <FieldLabel htmlFor='currentRank'>Current rank</FieldLabel>
                    <FieldDescription>
                      Choose the rank shown in Wild Rift today.
                    </FieldDescription>
                    <NativeSelect
                      className='w-full'
                      defaultValue={initial?.currentRank ?? ''}
                      id='currentRank'
                      name='currentRank'
                    >
                      <NativeSelectOption>Challenger</NativeSelectOption>
                      <NativeSelectOption>Grandmaster</NativeSelectOption>
                      <NativeSelectOption>Master</NativeSelectOption>
                      <NativeSelectOption>Diamond I</NativeSelectOption>
                      <NativeSelectOption>Diamond II</NativeSelectOption>
                      <NativeSelectOption>Diamond III</NativeSelectOption>
                      <NativeSelectOption>Diamond IV</NativeSelectOption>
                      <NativeSelectOption>Emerald I</NativeSelectOption>
                      <NativeSelectOption>Emerald II</NativeSelectOption>
                      <NativeSelectOption>Emerald III</NativeSelectOption>
                      <NativeSelectOption>Emerald IV</NativeSelectOption>
                      <NativeSelectOption>Platinum or below</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                </FieldGroup>

                <fieldset className='mt-7 border-t border-border pt-6'>
                  <legend className='text-sm font-semibold'>
                    Self-assessed tier
                  </legend>
                  <FieldDescription className='mt-1'>
                    Use the default mapping. The organizer makes the final call.
                  </FieldDescription>
                  <RadioGroup
                    className='mt-4 grid gap-3 tablet:grid-cols-2'
                    name='selfAssessedTier'
                    onValueChange={(value) => setSelectedTier(value as Tier)}
                    value={selectedTier}
                  >
                    {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                      <label
                        className={cn(
                          'flex min-h-17 cursor-pointer items-center gap-3 rounded-xl border bg-secondary p-3.5 has-[:focus-visible]:border-primary has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-primary/20',
                          selectedTier === tier
                            ? 'border-primary bg-primary-soft'
                            : 'border-border hover:border-border-strong',
                        )}
                        htmlFor={`self-tier-${tier}`}
                        key={tier}
                      >
                        <RadioGroupItem
                          className='sr-only'
                          id={`self-tier-${tier}`}
                          value={tier}
                        />
                        <TierBadge tier={tier} />
                        <span className='text-sm font-medium text-secondary-foreground'>
                          {tierMeta[tier].range}
                        </span>
                        <span
                          className={cn(
                            'ml-auto grid size-5 place-items-center rounded-full border',
                            selectedTier === tier
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border',
                          )}
                        >
                          <AnimatePresence initial={false} mode='wait'>
                            {selectedTier === tier ? (
                              <motion.span
                                animate={{ opacity: 1, transform: 'scale(1)' }}
                                aria-hidden='true'
                                exit={{ opacity: 0, transform: 'scale(0.75)' }}
                                initial={{
                                  opacity: 0,
                                  transform: 'scale(0.75)',
                                }}
                                key='selected'
                                transition={stateSwapTransition}
                              >
                                <Check size={12} />
                              </motion.span>
                            ) : null}
                          </AnimatePresence>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </fieldset>

                <FieldGroup className='mt-7 grid gap-5 border-t border-border pt-6 tablet:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor='primaryRole'>
                      <RoleIcon className='size-4' roleName={primaryRole} />
                      Primary role
                    </FieldLabel>
                    <NativeSelect
                      className='w-full'
                      id='primaryRole'
                      name='primaryRole'
                      onChange={(event) => {
                        const nextRole = event.target.value as Role;
                        setPrimaryRole(nextRole);
                        if (nextRole === secondaryRole)
                          setSecondaryRole(
                            starterSlots.find((role) => role !== nextRole) ??
                              'Baron',
                          );
                      }}
                      value={primaryRole}
                    >
                      {starterSlots.map((role) => (
                        <NativeSelectOption key={role}>
                          {role}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='secondaryRole'>
                      <RoleIcon className='size-4' roleName={secondaryRole} />
                      Secondary role
                    </FieldLabel>
                    <NativeSelect
                      className='w-full'
                      id='secondaryRole'
                      name='secondaryRole'
                      onChange={(event) =>
                        setSecondaryRole(event.target.value as Role)
                      }
                      value={secondaryRole}
                    >
                      {starterSlots.map((role) => (
                        <NativeSelectOption
                          disabled={role === primaryRole}
                          key={role}
                        >
                          {role}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                </FieldGroup>

                <div className='mt-7 flex flex-col gap-3 border-t border-border pt-6 tablet:flex-row tablet:items-center tablet:justify-between'>
                  <p className='m-0 max-w-md text-xs leading-5 text-muted-foreground'>
                    You can edit rank, tier, and roles until registration
                    closes. Changes reopen organizer review.
                  </p>
                  <FormSubmitButton className='shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'>
                    {initial ? 'Save profile' : 'Send for review'}{' '}
                    <ArrowRight size={16} />
                  </FormSubmitButton>
                </div>
                {state.error ? (
                  <Alert
                    className='mt-4'
                    aria-live='polite'
                    variant='destructive'
                  >
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                ) : null}
              </Card>

              <Card className='overflow-hidden'>
                <div className='border-b border-border p-5 desktop:p-6'>
                  <Kicker>DEFAULT TIER MAP</Kicker>
                  <h2 className='mt-2 font-display text-xl font-bold'>
                    Rank ranges
                  </h2>
                </div>
                <div className='grid tablet:grid-cols-2'>
                  {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                    <div
                      className='flex items-center gap-3 border-b border-border p-4 last:border-0 tablet:odd:border-r'
                      key={tier}
                    >
                      <TierBadge tier={tier} />
                      <p className='m-0 text-sm font-medium text-secondary-foreground'>
                        {tierMeta[tier].range}
                      </p>
                    </div>
                  ))}
                </div>
                <p className='m-0 border-t border-border bg-secondary px-5 py-4 text-xs leading-5 text-muted-foreground'>
                  Tier limits apply to the full roster, including substitutes:
                  at most one T1 and two T2 players.
                </p>
              </Card>
            </fieldset>
          </form>
        </div>
      </div>
    </PageFrame>
  );
}

export function TournamentRegistrationRoute(props: TournamentAppProps) {
  const {
    tournamentName = defaultSettings.tournamentName,
    region = defaultSettings.region,
    deadline = defaultSettings.deadline,
    deadlineRemaining = defaultSettings.deadlineRemaining,
    deadlineStatus = defaultSettings.deadlineStatus,
    registration,
  } = props;

  return (
    <TournamentAppRouteFrame {...props}>
      <RegistrationView
        deadline={deadline}
        deadlineRemaining={deadlineRemaining}
        deadlineStatus={deadlineStatus}
        region={region}
        registration={registration}
        tournamentName={tournamentName}
      />
    </TournamentAppRouteFrame>
  );
}
