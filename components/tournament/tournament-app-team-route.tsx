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
  LogOut,
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
import { AnimatedButtonLabel } from '@/components/ui/animated-button-label';
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
import { Card as ShadcnCard } from '@/components/ui/card';
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
  createTeam,
  deleteTeam,
  inviteParticipant,
  leaveTeam,
  renameTeam,
  respondToJoinRequest,
  respondToTeamInvite,
  submitTeam,
  transferTeamCaptaincy,
  updateTeamLineup,
  type TournamentActionState,
} from '@/app/tournament/actions';

function CreateTeamView({
  deadlineStatus,
  incomingInvites = [],
}: {
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  incomingInvites?: TournamentIncomingInviteData[];
}) {
  const [state, formAction] = useActionState<TournamentActionState, FormData>(
    createTeam,
    {},
  );
  const [inviteState, inviteAction] = useActionState<
    TournamentActionState,
    FormData
  >(respondToTeamInvite, {});
  const changesClosed = deadlineStatus === 'passed';

  return (
    <PageFrame>
      <div className='mx-auto flex max-w-2xl flex-col gap-6'>
        <SectionHeading
          detail='Start a draft roster, become its captain, and invite friends to fill the seven available places.'
          eyebrow='TEAM ROOM'
          title='Create your team'
        />
        {changesClosed ? (
          <Alert className='border-danger/30 bg-danger-soft text-danger'>
            <AlertDescription className='text-danger'>
              Team creation and invitation decisions are closed because the
              registration deadline has passed.
            </AlertDescription>
          </Alert>
        ) : null}
        {incomingInvites.length > 0 ? (
          <Card className='p-5 desktop:p-6'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <Kicker>TEAM INVITATIONS</Kicker>
                <h2 className='mt-2 font-display text-xl font-bold'>
                  Friends want you on their roster
                </h2>
              </div>
              <StatusPill tone='warning'>
                {incomingInvites.length} WAITING
              </StatusPill>
            </div>
            <div className='mt-5 grid gap-3 tablet:grid-cols-2'>
              {incomingInvites.map((invite) => (
                <div
                  className='rounded-2xl border border-primary/30 bg-primary-soft p-4'
                  key={invite.id}
                >
                  <Kicker className='text-primary-muted'>TEAM INVITE</Kicker>
                  <p className='mt-2 text-base font-semibold'>
                    {invite.teamName}
                  </p>
                  <p className='mt-1 text-xs leading-5 text-secondary-foreground'>
                    Captain {invite.captainName} · {invite.captainRiotId}
                  </p>
                  {!changesClosed ? (
                    <form action={inviteAction} className='mt-4 flex gap-2'>
                      <input name='inviteId' type='hidden' value={invite.id} />
                      <Button
                        className='min-h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary-hover'
                        name='decision'
                        size='lg'
                        type='submit'
                        value='accepted'
                      >
                        Accept
                      </Button>
                      <Button
                        className='min-h-11 flex-1 border border-border bg-secondary text-foreground hover:border-border-strong'
                        name='decision'
                        size='lg'
                        type='submit'
                        value='declined'
                      >
                        Decline
                      </Button>
                    </form>
                  ) : (
                    <p className='mt-3 text-xs text-muted-foreground'>
                      This invitation can no longer be changed.
                    </p>
                  )}
                </div>
              ))}
            </div>
            {inviteState.error ? (
              <Alert aria-live='polite' className='mt-4' variant='destructive'>
                <AlertDescription>{inviteState.error}</AlertDescription>
              </Alert>
            ) : null}
            {inviteState.success ? (
              <Alert
                aria-live='polite'
                className='mt-4 border-success/30 bg-success-soft text-success'
              >
                <AlertDescription className='text-success'>
                  {inviteState.success}
                </AlertDescription>
              </Alert>
            ) : null}
          </Card>
        ) : null}
        <Card className='p-5 desktop:p-6'>
          <form action={formAction} className='flex flex-col gap-5'>
            <fieldset className='contents' disabled={changesClosed}>
              <Field>
                <FieldLabel htmlFor='teamName'>Team name</FieldLabel>
                <Input
                  className='min-h-12 rounded-xl px-3.5 text-base'
                  id='teamName'
                  name='teamName'
                  placeholder='Night Sentinels'
                  required
                />
                <FieldDescription>
                  You can rename a draft team later as captain.
                </FieldDescription>
              </Field>
              {state.error ? (
                <Alert aria-live='polite' variant='destructive'>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
              {state.success ? (
                <motion.div
                  animate={{
                    opacity: 1,
                    transform: 'translateY(0px) scale(1)',
                  }}
                  aria-live='polite'
                  className='rounded-xl'
                  initial={{
                    opacity: 0,
                    transform: 'translateY(8px) scale(0.99)',
                  }}
                  transition={{ duration: 0.22, ease: easeOutExpo }}
                >
                  <Alert
                    className='border-success/30 bg-success-soft text-success'
                    aria-live='polite'
                  >
                    <AlertDescription className='text-success'>
                      {state.success}
                    </AlertDescription>
                  </Alert>
                  <ButtonLink className='mt-4' href='/tournament/team'>
                    Open team room <ArrowRight size={16} />
                  </ButtonLink>
                </motion.div>
              ) : (
                <FormSubmitButton className='self-start bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'>
                  <Plus size={17} /> Create team
                </FormSubmitButton>
              )}
            </fieldset>
          </form>
        </Card>
      </div>
    </PageFrame>
  );
}

function RegistrationRequiredTeamView() {
  return (
    <PageFrame>
      <div className='mx-auto flex max-w-2xl flex-col gap-6'>
        <SectionHeading
          detail='Complete your player profile before creating or joining a team. You can still browse the current drafts first.'
          eyebrow='TEAM ROOM'
          title='Finish your registration'
        />
        <Card className='p-6 desktop:p-8'>
          <StatusPill tone='warning'>REGISTRATION REQUIRED</StatusPill>
          <h2 className='mt-4 font-display text-2xl font-bold'>
            Your player details come first
          </h2>
          <p className='mt-2 text-sm leading-6 text-secondary-foreground'>
            The organizer needs your Riot ID, rank, tier, and role preferences
            before you can hold a roster spot.
          </p>
          <div className='mt-6 flex flex-col gap-3 phone:flex-row'>
            <ButtonLink href='/tournament/register'>
              Complete profile <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href='/tournament/teams' variant='secondary'>
              Browse teams
            </ButtonLink>
          </div>
        </Card>
      </div>
    </PageFrame>
  );
}

function LineupMoveMenu({
  assignment,
  assignments,
  members,
  onArrange,
  onClose,
  desktopPlacement = 'right',
}: {
  assignment: LineupAssignment;
  assignments: LineupAssignment[];
  members: TournamentMemberData[];
  onArrange: (registrationId: string, target: LineupDropTarget) => void;
  onClose: () => void;
  desktopPlacement?: 'left' | 'right';
}) {
  const memberName = (registrationId: string) =>
    members.find((member) => member.registrationId === registrationId)
      ?.displayName ?? 'Player';
  const substitutes = assignments.filter(
    (entry) => entry.lineupPosition === 'substitute',
  );
  const choose = (target: LineupDropTarget) => {
    onArrange(assignment.registrationId, target);
    onClose();
  };

  return (
    <motion.div
      animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
      aria-label={`Move ${memberName(assignment.registrationId)}`}
      className={cn(
        'absolute top-[calc(100%+10px)] right-0 z-50 w-[min(296px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border border-border-strong bg-background shadow-2xl shadow-background/60',
        desktopPlacement === 'left' &&
          'desktop:left-0 desktop:right-auto desktop:origin-top-left',
      )}
      data-lineup-move-menu
      exit={{ opacity: 0, transform: 'translateY(-4px) scale(0.98)' }}
      initial={{ opacity: 0, transform: 'translateY(-4px) scale(0.98)' }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      role='menu'
      transition={{ duration: 0.18, ease: easeOutExpo }}
    >
      <div className='flex items-start justify-between gap-3 bg-secondary px-4 py-3'>
        <div>
          <Kicker className='text-primary'>
            MOVE {memberName(assignment.registrationId).toUpperCase()}
          </Kicker>
          <p className='mt-1 text-xs font-medium text-foreground'>
            Choose a new position
          </p>
        </div>
        <button
          aria-label='Close move menu'
          className='grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out-quad hover:bg-background/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] motion-reduce:active:scale-100'
          onClick={onClose}
          type='button'
        >
          <X aria-hidden='true' size={16} />
        </button>
      </div>
      <div className='border-t border-border px-2.5 py-2.5'>
        <Kicker className='px-2 text-[8px] tracking-[0.12em]'>
          CHOOSE DESTINATION
        </Kicker>
        <div className='mt-1.5 grid gap-1'>
          {starterSlots.map((role) => {
            const occupant = assignments.find(
              (entry) =>
                entry.lineupPosition === 'starter' &&
                entry.starterRole === role,
            );
            const current =
              occupant?.registrationId === assignment.registrationId;
            const occupiedByOther = Boolean(
              occupant && occupant.registrationId !== assignment.registrationId,
            );
            return (
              <button
                aria-current={current ? 'true' : undefined}
                className={cn(
                  'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left transition-[background-color,border-color,color,transform] duration-150 ease-out-quad focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring active:scale-[0.99] motion-reduce:active:scale-100',
                  current
                    ? 'cursor-default bg-background/60 text-muted-foreground'
                    : 'text-secondary-foreground hover:bg-secondary hover:text-foreground',
                )}
                disabled={current}
                key={role}
                onClick={() =>
                  choose(
                    occupiedByOther && occupant
                      ? {
                          kind: 'player',
                          registrationId: occupant.registrationId,
                        }
                      : { kind: 'starter', role },
                  )
                }
                role='menuitem'
                type='button'
              >
                <span className='flex min-w-0 items-center gap-2.5'>
                  <RoleIcon
                    className={cn(
                      'size-5',
                      current ? 'text-primary' : 'text-muted-foreground',
                    )}
                    roleName={role}
                  />
                  <span className='truncate text-xs font-medium'>{role}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[8px] font-bold tracking-[0.08em]',
                    current ? 'text-muted-foreground' : 'text-primary-muted',
                  )}
                >
                  {current
                    ? 'CURRENT'
                    : occupiedByOther && occupant
                      ? `SWAP · ${memberName(occupant.registrationId).toUpperCase()}`
                      : 'MOVE'}
                </span>
              </button>
            );
          })}
          {assignment.lineupPosition === 'starter' && substitutes.length < 2 ? (
            <button
              className='flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-secondary-foreground transition-[background-color,border-color,color,transform] duration-150 ease-out-quad hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring active:scale-[0.99] motion-reduce:active:scale-100'
              onClick={() => choose({ kind: 'substitute' })}
              role='menuitem'
              type='button'
            >
              <span className='flex items-center gap-2.5'>
                <span className='grid size-5 place-items-center rounded-md bg-secondary text-muted-foreground'>
                  <Users aria-hidden='true' size={13} />
                </span>
                <span className='text-xs font-medium'>Substitute</span>
              </span>
              <span className='font-mono text-[8px] font-bold tracking-[0.08em] text-primary-muted'>
                MOVE
              </span>
            </button>
          ) : null}
          {assignment.lineupPosition === 'starter' && substitutes.length === 2
            ? substitutes.map((substitute) => (
                <button
                  className='flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-secondary-foreground transition-[background-color,border-color,color,transform] duration-150 ease-out-quad hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring active:scale-[0.99] motion-reduce:active:scale-100'
                  key={substitute.registrationId}
                  onClick={() =>
                    choose({
                      kind: 'player',
                      registrationId: substitute.registrationId,
                    })
                  }
                  role='menuitem'
                  type='button'
                >
                  <span className='flex items-center gap-2.5'>
                    <span className='grid size-5 place-items-center rounded-md bg-secondary text-muted-foreground'>
                      <Users aria-hidden='true' size={13} />
                    </span>
                    <span className='text-xs font-medium'>
                      {memberName(substitute.registrationId)}
                    </span>
                  </span>
                  <span className='font-mono text-[8px] font-bold tracking-[0.08em] text-primary-muted'>
                    SWAP
                  </span>
                </button>
              ))
            : null}
        </div>
      </div>
      {assignment.lineupPosition === 'starter' && substitutes.length > 0 ? (
        <div className='border-t border-border px-2.5 py-2.5'>
          <Kicker className='px-2 text-[8px] tracking-[0.12em]'>
            SWAP WITH A PLAYER
          </Kicker>
          <div className='mt-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-2'>
            <p className='m-0 flex items-start gap-2 text-[10px] leading-4 text-secondary-foreground'>
              <Info
                aria-hidden='true'
                className='mt-0.5 shrink-0 text-primary'
                size={13}
              />
              Occupied slots become swaps automatically.
            </p>
          </div>
        </div>
      ) : null}
      <div className='border-t border-border bg-background/60 px-4 py-2.5'>
        <p className='m-0 text-[10px] leading-4 text-muted-foreground'>
          Changes remain draft until you save the lineup.
        </p>
      </div>
    </motion.div>
  );
}

function LineupPlayerCard({
  assignment,
  assignments,
  member,
  members,
  onArrange,
  onDragStateChange,
  canEdit,
  moveMenuOpen,
  onToggleMoveMenu,
  onCloseMoveMenu,
  isSwapParticipant,
  swapAnimationKey,
  variant,
  role,
}: {
  assignment: LineupAssignment;
  assignments: LineupAssignment[];
  member: TournamentMemberData;
  members: TournamentMemberData[];
  onArrange: (registrationId: string, target: LineupDropTarget) => void;
  onDragStateChange: (registrationId: string, active: boolean) => void;
  canEdit: boolean;
  moveMenuOpen: boolean;
  onToggleMoveMenu: () => void;
  onCloseMoveMenu: () => void;
  isSwapParticipant: boolean;
  swapAnimationKey: number | null;
  variant: 'starter' | 'substitute';
  role?: Role;
}) {
  const player = playerFromMember(member);
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();
  const [isDragging, setIsDragging] = useState(false);
  const isStarter = variant === 'starter';

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    dragControls.start(event);
  };

  return (
    <motion.div
      className={cn(
        'relative select-none border border-border bg-secondary shadow-sm',
        isStarter
          ? 'flex min-h-23 flex-col justify-between gap-3 rounded-[11px] p-3.25'
          : 'flex min-h-13 items-center gap-3 rounded-[10px] px-2.5 py-2',
        isDragging && 'border-primary/70 shadow-xl shadow-background/50',
      )}
      drag={canEdit}
      dragControls={dragControls}
      dragElastic={0.06}
      dragListener={false}
      dragMomentum={false}
      dragSnapToOrigin
      layout={canEdit && !shouldReduceMotion}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onDragStateChange(assignment.registrationId, false);
        const target = lineupDropTargetAtPoint(info.point);
        if (target) onArrange(assignment.registrationId, target);
      }}
      onDragStart={() => {
        setIsDragging(true);
        onDragStateChange(assignment.registrationId, true);
      }}
      style={{
        borderRadius: isStarter ? 11 : 10,
        pointerEvents: isDragging ? 'none' : 'auto',
        zIndex: isDragging ? 30 : moveMenuOpen ? 60 : 1,
      }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { layout: { type: 'spring', duration: 0.36, bounce: 0.08 } }
      }
      whileDrag={shouldReduceMotion ? undefined : { scale: 1.02 }}
    >
      {isSwapParticipant && swapAnimationKey !== null ? (
        <motion.div
          animate={
            shouldReduceMotion
              ? { opacity: [0, 0.72, 0] }
              : {
                  opacity: [0, 1, 0],
                  transform: ['scale(0.96)', 'scale(1.01)', 'scale(1)'],
                }
          }
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 z-10 border-2 border-primary bg-primary/5'
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, transform: 'scale(0.96)' }
          }
          key={`swap-pulse-${swapAnimationKey}`}
          style={{ borderRadius: isStarter ? 11 : 10 }}
          transition={{ duration: 0.34, ease: easeOutExpo }}
        />
      ) : null}
      <div
        className={cn(
          'min-w-0 touch-none cursor-grab active:cursor-grabbing',
          isStarter
            ? 'flex items-start justify-between gap-2'
            : 'flex flex-1 items-center gap-3',
        )}
        onPointerDown={startDrag}
        title={canEdit ? `Drag ${player.name} to change position` : undefined}
      >
        <div
          className={cn(
            'flex min-w-0 items-center',
            isStarter ? 'gap-2' : 'gap-3',
          )}
        >
          {isStarter && role ? (
            <RoleIcon
              className={cn(
                'size-5',
                role === assignment.starterRole
                  ? 'text-role-icon'
                  : 'text-muted-foreground',
              )}
              roleName={role}
            />
          ) : null}
          {!isStarter ? <Avatar player={player} size='size-7' /> : null}
          {canEdit ? (
            <GripVertical
              aria-hidden='true'
              className='shrink-0 text-muted-foreground hover:text-primary focus-visible:text-primary'
              size={15}
              strokeWidth={1.8}
            />
          ) : null}
          <div className='min-w-0'>
            <p
              className={cn(
                'm-0 truncate font-semibold text-foreground',
                isStarter ? 'text-sm' : 'text-xs',
              )}
              title={player.name}
            >
              {player.name}
              {player.isCaptain ? (
                <span className='ml-1 text-[9px] font-medium text-primary-muted'>
                  captain
                </span>
              ) : null}
            </p>
            <div className='mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground'>
              <span>{player.tier}</span>
              <span aria-hidden='true'>·</span>
              <RoleIcon
                className='size-3 text-muted-foreground'
                roleName={player.primaryRole}
              />
              <span className='sr-only'>Primary role {player.primaryRole}</span>
              <RoleIcon
                className='size-3 text-muted-foreground'
                roleName={player.secondaryRole}
              />
              <span className='sr-only'>
                Secondary role {player.secondaryRole}
              </span>
            </div>
          </div>
        </div>
        {isStarter ? (
          <span className='shrink-0 font-mono text-[8px] font-bold tracking-[0.08em] text-success'>
            STARTER
          </span>
        ) : null}
      </div>
      {canEdit ? (
        <div
          className={cn(
            'relative shrink-0',
            isStarter ? 'self-end' : 'ml-auto',
          )}
        >
          <Button
            aria-expanded={moveMenuOpen}
            aria-haspopup='menu'
            className='min-h-9 gap-1.5 rounded-md border border-border-strong bg-background/25 px-2 text-[10px] text-foreground hover:border-primary/60 hover:bg-background/60 hover:text-foreground desktop:min-h-8'
            data-lineup-move-trigger
            onClick={(event) => {
              event.stopPropagation();
              onToggleMoveMenu();
            }}
            size='sm'
            type='button'
          >
            <ArrowLeftRight aria-hidden='true' size={13} />
            <span>Move</span>
          </Button>
          <AnimatePresence initial={false}>
            {moveMenuOpen ? (
              <LineupMoveMenu
                assignment={assignment}
                assignments={assignments}
                desktopPlacement={
                  isStarter && role !== 'Support' ? 'left' : 'right'
                }
                members={members}
                onArrange={onArrange}
                onClose={onCloseMoveMenu}
              />
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </motion.div>
  );
}

function LineupRoleSlot({
  assignment,
  activeRegistrationId,
  assignments,
  canEdit,
  member,
  members,
  onArrange,
  onDragStateChange,
  onCloseMoveMenu,
  onToggleMoveMenu,
  moveMenuRegistrationId,
  isSwapParticipant,
  swapAnimationKey,
  role,
}: {
  assignment?: LineupAssignment;
  activeRegistrationId: string | null;
  assignments: LineupAssignment[];
  canEdit: boolean;
  member?: TournamentMemberData;
  members: TournamentMemberData[];
  onArrange: (registrationId: string, target: LineupDropTarget) => void;
  onDragStateChange: (registrationId: string, active: boolean) => void;
  onCloseMoveMenu: () => void;
  onToggleMoveMenu: () => void;
  moveMenuRegistrationId: string | null;
  isSwapParticipant: boolean;
  swapAnimationKey: number | null;
  role: Role;
}) {
  const activeDrop = Boolean(
    activeRegistrationId && activeRegistrationId !== assignment?.registrationId,
  );

  if (!assignment || !member) {
    return (
      <ShadcnCard
        className={cn(
          'flex min-h-[92px] select-none flex-col justify-between rounded-[11px] border bg-background/15 p-[13px] text-left ring-0 transition-[background-color,border-color,transform] duration-200 ease-out-quad desktop:min-h-[92px]',
          activeDrop
            ? 'border-primary/70 bg-primary/5'
            : 'border-border-strong',
        )}
        data-lineup-drop-kind='starter'
        data-lineup-role={role}
        role='article'
      >
        <div className='flex items-start justify-between gap-2'>
          <RoleIcon className='size-5 text-muted-foreground' roleName={role} />
          <span className='font-mono text-[8px] text-muted-foreground'>
            OPEN
          </span>
        </div>
        <p className='m-0 text-sm font-semibold text-secondary-foreground'>
          Drop player here
        </p>
        <span className='sr-only'>{role} starter slot is open</span>
      </ShadcnCard>
    );
  }

  return (
    <ShadcnCard
      className={cn(
        'relative min-h-[92px] select-none overflow-visible rounded-[11px] border bg-secondary p-0 ring-0 transition-[background-color,border-color,transform] duration-200 ease-out-quad',
        activeDrop ? 'border-primary/70 bg-primary/5' : 'border-border-strong',
      )}
      data-lineup-drop-kind='starter'
      data-lineup-role={role}
      role='article'
    >
      <div
        className='h-full'
        data-lineup-drop-kind='player'
        data-registration-id={assignment.registrationId}
      >
        <LineupPlayerCard
          assignment={assignment}
          assignments={assignments}
          canEdit={canEdit}
          member={member}
          members={members}
          moveMenuOpen={moveMenuRegistrationId === assignment.registrationId}
          onArrange={onArrange}
          onCloseMoveMenu={onCloseMoveMenu}
          onDragStateChange={onDragStateChange}
          onToggleMoveMenu={onToggleMoveMenu}
          isSwapParticipant={isSwapParticipant}
          swapAnimationKey={swapAnimationKey}
          role={role}
          variant='starter'
        />
      </div>
    </ShadcnCard>
  );
}

function LineupEditor({
  team,
  currentRegistrationId,
  deadlineStatus,
  onAssignmentsChange,
  className,
  preview = false,
}: {
  team: TournamentTeamData;
  currentRegistrationId?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  onAssignmentsChange?: (assignments: LineupAssignment[]) => void;
  className?: string;
  preview?: boolean;
}) {
  const captain = team.members.some(
    (member) =>
      member.registrationId === currentRegistrationId && member.isCaptain,
  );
  const canEdit =
    preview ||
    (captain && team.status === 'draft' && deadlineStatus !== 'passed');
  const [draftAssignments, setDraftAssignments] = useState<LineupAssignment[]>(
    team.members.map((member) => ({
      registrationId: member.registrationId,
      lineupPosition: member.lineupPosition,
      starterRole: member.starterRole,
    })),
  );
  const assignments = reconcileLineupAssignments(
    draftAssignments,
    team.members,
  );
  const [activeRegistrationId, setActiveRegistrationId] = useState<
    string | null
  >(null);
  const [moveMenuRegistrationId, setMoveMenuRegistrationId] = useState<
    string | null
  >(null);
  const [moveMessage, setMoveMessage] = useState('');
  const [previewSaveMessage, setPreviewSaveMessage] = useState('');
  const [swapAnimation, setSwapAnimation] = useState<{
    registrationIds: string[];
    key: number;
  } | null>(null);
  const [state, formAction] = useActionState<TournamentActionState, FormData>(
    updateTeamLineup,
    {},
  );
  const substitutes = assignments.filter(
    (assignment) => assignment.lineupPosition === 'substitute',
  );
  const starterCount = assignments.filter(
    (assignment) => assignment.lineupPosition === 'starter',
  ).length;
  const displayedMembers = team.members.map((member) => {
    const assignment = assignments.find(
      (candidate) => candidate.registrationId === member.registrationId,
    );
    return assignment
      ? {
          ...member,
          lineupPosition: assignment.lineupPosition,
          starterRole: assignment.starterRole,
        }
      : member;
  });
  const validation = validateRoster(displayedMembers);
  const blockingIssueCount = validation.blockingIssues.filter(
    (issue) => !issue.toLowerCase().startsWith('add '),
  ).length;

  useEffect(() => {
    if (!moveMenuRegistrationId) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (
        target?.closest('[data-lineup-move-trigger]') ||
        target?.closest('[data-lineup-move-menu]')
      ) {
        return;
      }
      setMoveMenuRegistrationId(null);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [moveMenuRegistrationId]);

  const arrange = (registrationId: string, target: LineupDropTarget) => {
    if (!canEdit) return;
    const next = arrangeLineupAssignments(assignments, registrationId, target);
    if (next === assignments) return;
    const targetAssignment =
      target.kind === 'player'
        ? assignments.find(
            (assignment) => assignment.registrationId === target.registrationId,
          )
        : target.kind === 'starter'
          ? assignments.find(
              (assignment) =>
                assignment.lineupPosition === 'starter' &&
                assignment.starterRole === target.role,
            )
          : undefined;
    setDraftAssignments(next);
    onAssignmentsChange?.(next);
    const isSwap = Boolean(
      targetAssignment && targetAssignment.registrationId !== registrationId,
    );
    setSwapAnimation((current) => {
      if (!isSwap || !targetAssignment) {
        return null;
      }
      return {
        registrationIds: [registrationId, targetAssignment.registrationId],
        key: (current?.key ?? 0) + 1,
      };
    });
    const playerName = team.members.find(
      (member) => member.registrationId === registrationId,
    )?.displayName;
    const targetName = targetAssignment
      ? team.members.find(
          (member) => member.registrationId === targetAssignment.registrationId,
        )?.displayName
      : null;
    setMoveMessage(
      target.kind === 'starter'
        ? isSwap
          ? `${playerName ?? 'Player'} swapped with ${targetName ?? 'the selected player'}. Save to keep this arrangement.`
          : `${playerName ?? 'Player'} moved to ${target.role}. Save to keep this arrangement.`
        : target.kind === 'player'
          ? `${playerName ?? 'Player'} swapped with ${targetName ?? 'the selected player'}. Save to keep this arrangement.`
          : `${playerName ?? 'Player'} moved to substitute. Save to keep this arrangement.`,
    );
    setMoveMenuRegistrationId(null);
  };

  const memberFor = (assignment?: LineupAssignment) =>
    assignment
      ? team.members.find(
          (member) => member.registrationId === assignment.registrationId,
        )
      : undefined;

  const renderSubstitute = (assignment: LineupAssignment) => {
    const member = memberFor(assignment);
    if (!member) return null;
    return (
      <div
        className={cn(
          'relative min-w-0 flex-1',
          activeRegistrationId &&
            activeRegistrationId !== assignment.registrationId &&
            'rounded-[10px] ring-1 ring-primary/60',
        )}
        data-lineup-drop-kind='player'
        data-registration-id={assignment.registrationId}
        key={assignment.registrationId}
      >
        <LineupPlayerCard
          assignment={assignment}
          assignments={assignments}
          canEdit={canEdit}
          isSwapParticipant={Boolean(
            swapAnimation?.registrationIds.includes(assignment.registrationId),
          )}
          member={member}
          members={team.members}
          moveMenuOpen={moveMenuRegistrationId === assignment.registrationId}
          onArrange={arrange}
          onCloseMoveMenu={() => setMoveMenuRegistrationId(null)}
          onDragStateChange={(registrationId, active) =>
            setActiveRegistrationId(active ? registrationId : null)
          }
          onToggleMoveMenu={() =>
            setMoveMenuRegistrationId((current) =>
              current === assignment.registrationId
                ? null
                : assignment.registrationId,
            )
          }
          swapAnimationKey={swapAnimation?.key ?? null}
          variant='substitute'
        />
      </div>
    );
  };

  return (
    <Card
      aria-labelledby='starting-lineup-heading'
      className={cn(
        'relative select-none overflow-visible bg-card p-[14px] desktop:p-[18px]',
        className,
      )}
      id='starting-lineup-card'
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <Kicker>STARTING LINEUP</Kicker>
          <h2
            className='mt-1 font-display text-lg font-bold desktop:text-[18px]'
            id='starting-lineup-heading'
          >
            Five assigned roles
          </h2>
        </div>
        <span className='font-mono text-xs text-secondary-foreground'>
          {starterCount} / 5
          <span className='hidden desktop:inline'> starters</span>
        </span>
      </div>

      {canEdit ? (
        <div className='mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/35 px-2.5 py-2 text-[11px] text-secondary-foreground'>
          <span className='flex min-w-0 items-center gap-2'>
            <GripVertical
              aria-hidden='true'
              className='shrink-0 text-primary'
              size={15}
            />
            <span>Drag a player card, or use Move to choose a role</span>
          </span>
          <span className='hidden shrink-0 font-mono text-[8px] font-bold tracking-[0.1em] text-primary desktop:inline'>
            CAPTAIN CONTROL
          </span>
        </div>
      ) : (
        <p className='mt-3 rounded-lg border border-border bg-background/35 px-2.5 py-2 text-[11px] text-muted-foreground'>
          {team.status === 'submitted'
            ? 'This roster is locked for participant editing.'
            : deadlineStatus === 'passed'
              ? 'Roster changes closed with registration.'
              : 'Only the team captain can arrange this lineup.'}
        </p>
      )}

      {blockingIssueCount > 0 ? (
        <div className='mt-3 flex items-center justify-between gap-4 text-[11px]'>
          <span className='flex items-center gap-2 font-semibold text-danger'>
            <AlertTriangle aria-hidden='true' size={15} />
            Invalid roster · {blockingIssueCount} blockers
          </span>
          <span className='hidden text-muted-foreground desktop:inline'>
            5 named roles must be filled before submission
          </span>
        </div>
      ) : null}

      <form
        action={preview ? undefined : formAction}
        className='mt-3'
        onSubmit={
          preview
            ? (event) => {
                event.preventDefault();
                setPreviewSaveMessage('Lineup saved to the draft.');
              }
            : undefined
        }
      >
        {canEdit ? (
          <>
            <input name='teamId' type='hidden' value={team.id} />
            <input
              name='lineup'
              type='hidden'
              value={JSON.stringify(assignments)}
            />
          </>
        ) : null}
        <LayoutGroup id={`lineup-${team.id}`}>
          <div className='grid gap-2 desktop:grid-cols-5'>
            {starterSlots.map((role) => {
              const assignment = assignments.find(
                (entry) =>
                  entry.lineupPosition === 'starter' &&
                  entry.starterRole === role,
              );
              return (
                <LineupRoleSlot
                  activeRegistrationId={activeRegistrationId}
                  assignment={assignment}
                  assignments={assignments}
                  canEdit={canEdit}
                  isSwapParticipant={Boolean(
                    swapAnimation?.registrationIds.includes(
                      assignment?.registrationId ?? '',
                    ),
                  )}
                  key={role}
                  member={memberFor(assignment)}
                  members={team.members}
                  moveMenuRegistrationId={moveMenuRegistrationId}
                  onArrange={arrange}
                  onCloseMoveMenu={() => setMoveMenuRegistrationId(null)}
                  onDragStateChange={(registrationId, active) =>
                    setActiveRegistrationId(active ? registrationId : null)
                  }
                  onToggleMoveMenu={() =>
                    assignment
                      ? setMoveMenuRegistrationId((current) =>
                          current === assignment.registrationId
                            ? null
                            : assignment.registrationId,
                        )
                      : undefined
                  }
                  swapAnimationKey={swapAnimation?.key ?? null}
                  role={role}
                />
              );
            })}
          </div>

          <div className='mt-3 border-t border-border pt-3'>
            <div className='flex flex-col gap-2 desktop:flex-row desktop:items-center'>
              <div className='flex shrink-0 items-center justify-between gap-4 desktop:w-[112px] desktop:flex-col desktop:items-start desktop:justify-center desktop:gap-0'>
                <Kicker>SUBSTITUTES</Kicker>
                <span className='text-[11px] text-muted-foreground'>
                  {substitutes.length} / 2 slots
                </span>
              </div>
              <div className='flex min-w-0 flex-1 flex-col gap-2 tablet:flex-row'>
                {substitutes.map(renderSubstitute)}
                {substitutes.length < 2 ? (
                  <div
                    className={cn(
                      'flex min-h-[52px] min-w-0 flex-1 select-none items-center gap-2 rounded-[10px] border border-border-strong bg-background/15 px-2.5 text-sm font-semibold text-secondary-foreground transition-[background-color,border-color,color,transform] duration-200 ease-out-quad',
                      activeRegistrationId
                        ? 'border-primary/70 bg-primary/5 text-primary-muted'
                        : 'border-border-strong',
                    )}
                    data-lineup-drop-kind='substitute'
                  >
                    <Plus
                      aria-hidden='true'
                      className='text-muted-foreground'
                      size={18}
                    />
                    <span>Drop substitute here</span>
                  </div>
                ) : null}
              </div>
              {canEdit ? (
                <FormSubmitButton className='min-h-10 w-full bg-primary px-3.5 text-xs text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary-hover desktop:w-auto'>
                  <Check aria-hidden='true' size={15} /> Save lineup
                </FormSubmitButton>
              ) : null}
            </div>
          </div>
        </LayoutGroup>

        <p aria-live='polite' className='sr-only'>
          {moveMessage}
        </p>
        {state.error ? (
          <Alert aria-live='polite' className='mt-3' variant='destructive'>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        {state.success || previewSaveMessage ? (
          <p
            aria-live='polite'
            className='mt-2 text-[10px] font-medium text-success'
          >
            {state.success ?? previewSaveMessage}
          </p>
        ) : null}
      </form>
    </Card>
  );
}

function TeamMembershipControls({
  team,
  currentRegistrationId,
  deadlineStatus,
}: {
  team: TournamentTeamData;
  currentRegistrationId?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  const currentMember = team.members.find(
    (member) => member.registrationId === currentRegistrationId,
  );
  const [leaveState, leaveAction] = useActionState<
    TournamentActionState,
    FormData
  >(leaveTeam, {});
  const [deleteState, deleteAction] = useActionState<
    TournamentActionState,
    FormData
  >(deleteTeam, {});
  const [transferState, transferAction] = useActionState<
    TournamentActionState,
    FormData
  >(transferTeamCaptaincy, {});

  if (!currentMember) return null;

  const exitMode = participantTeamExitMode({
    isCaptain: currentMember.isCaptain,
    memberCount: team.members.length,
  });
  const locked = team.status !== 'draft' || deadlineStatus === 'passed';
  const teammates = team.members.filter(
    (member) => member.registrationId !== currentMember.registrationId,
  );
  const actionError =
    leaveState.error ?? deleteState.error ?? transferState.error;

  return (
    <Card className='p-5'>
      <Kicker>TEAM MEMBERSHIP</Kicker>
      <h2 className='mt-2 font-display text-lg font-bold'>Your team spot</h2>
      {locked ? (
        <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
          {deadlineStatus === 'passed'
            ? 'Membership changes closed with registration.'
            : 'Ask the organizer to unlock this submitted team before changing membership.'}
        </p>
      ) : exitMode === 'transfer' ? (
        <>
          <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
            Choose a new captain first. You can leave after the transfer.
          </p>
          <form action={transferAction} className='mt-4 flex flex-col gap-3'>
            <input name='teamId' type='hidden' value={team.id} />
            <Field>
              <FieldLabel htmlFor='nextCaptainRegistrationId'>
                New captain
              </FieldLabel>
              <NativeSelect
                className='w-full'
                defaultValue=''
                id='nextCaptainRegistrationId'
                name='registrationId'
                required
              >
                <NativeSelectOption disabled value=''>
                  Choose a teammate
                </NativeSelectOption>
                {teammates.map((member) => (
                  <NativeSelectOption
                    key={member.registrationId}
                    value={member.registrationId}
                  >
                    {member.displayName} · {member.riotName}#{member.riotTag}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <FormSubmitButton className='w-full border border-border bg-secondary text-foreground hover:border-border-strong'>
              <Crown size={16} /> Transfer captaincy
            </FormSubmitButton>
          </form>
        </>
      ) : exitMode === 'delete' ? (
        <>
          <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
            You are the only member. Deleting the team keeps your player profile
            and lets you create or join another team.
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  className='mt-4 w-full border border-danger/35 bg-danger-soft text-danger hover:bg-danger/15'
                  size='lg'
                />
              }
            >
              <Trash2 size={16} /> Delete team
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {team.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the team and its pending invitations and
                  requests. Your player profile stays active.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep team</AlertDialogCancel>
                <form action={deleteAction}>
                  <input name='teamId' type='hidden' value={team.id} />
                  <AlertDialogAction type='submit' variant='destructive'>
                    Delete team
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
            Leaving releases your roster spot. You will need a new invitation or
            join request to return.
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  className='mt-4 w-full border border-danger/35 bg-danger-soft text-danger hover:bg-danger/15'
                  size='lg'
                />
              }
            >
              <LogOut size={16} /> Leave team
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave {team.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose this roster spot. Your player profile and
                  tournament access will stay active.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay on team</AlertDialogCancel>
                <form action={leaveAction}>
                  <input name='teamId' type='hidden' value={team.id} />
                  <AlertDialogAction type='submit' variant='destructive'>
                    Leave team
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {actionError ? (
        <Alert aria-live='polite' className='mt-4' variant='destructive'>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}
      {transferState.success ? (
        <Alert
          aria-live='polite'
          className='mt-4 border-success/30 bg-success-soft text-success'
        >
          <AlertDescription className='text-success'>
            {transferState.success} You can now leave the team.
          </AlertDescription>
        </Alert>
      ) : null}
    </Card>
  );
}

function TeamRoomView(props: {
  initialSubmitted?: boolean;
  team?: TournamentTeamData | null;
  registration?: TournamentRegistrationData | null;
  currentRegistrationId?: string;
  participants?: TournamentParticipantOption[];
  incomingInvites?: TournamentIncomingInviteData[];
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  if (props.team === null && props.registration === null) {
    return <RegistrationRequiredTeamView />;
  }

  if (props.team === null) {
    return (
      <CreateTeamView
        deadlineStatus={props.deadlineStatus}
        incomingInvites={props.incomingInvites}
      />
    );
  }

  return <TeamRoomContent {...props} team={props.team ?? undefined} />;
}

function TeamRoomContent({
  initialSubmitted = false,
  team,
  currentRegistrationId,
  participants,
  deadlineStatus,
}: {
  initialSubmitted?: boolean;
  team?: TournamentTeamData;
  currentRegistrationId?: string;
  participants?: TournamentParticipantOption[];
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  const preview = team === undefined;
  const [submitted, setSubmitted] = useState(
    initialSubmitted || team?.status === 'submitted',
  );
  const [requestState, setRequestState] = useState<
    'pending' | 'accepted' | 'declined'
  >('pending');
  const [renaming, setRenaming] = useState(false);
  const [lineupDraft, setLineupDraft] = useState<LineupAssignment[] | null>(
    null,
  );
  const [submitState, submitAction] = useActionState<
    TournamentActionState,
    FormData
  >(submitTeam, {});
  const [requestActionState, requestAction] = useActionState<
    TournamentActionState,
    FormData
  >(respondToJoinRequest, {});
  const [inviteState, inviteAction] = useActionState<
    TournamentActionState,
    FormData
  >(inviteParticipant, {});
  const [renameState, renameAction] = useActionState<
    TournamentActionState,
    FormData
  >(renameTeam, {});
  const actualTeam = team;
  const liveMembers = actualTeam?.members ?? [];
  const displayedMembers = lineupDraft
    ? liveMembers.map((member) => {
        const assignment = lineupDraft.find(
          (candidate) => candidate.registrationId === member.registrationId,
        );
        return assignment
          ? {
              ...member,
              lineupPosition: assignment.lineupPosition,
              starterRole: assignment.starterRole,
            }
          : member;
      })
    : liveMembers;
  const liveValidation = actualTeam ? validateRoster(displayedMembers) : null;
  const liveStarters = actualTeam
    ? starterSlots.map((role) => {
        const member = displayedMembers.find(
          (candidate) =>
            candidate.lineupPosition === 'starter' &&
            candidate.starterRole === role,
        );
        return member ? playerFromMember(member) : undefined;
      })
    : rosterPlayers.slice(0, 5);
  const substituteCount = actualTeam
    ? displayedMembers.filter(
        (member) => member.lineupPosition === 'substitute',
      ).length
    : Number(Boolean(rosterPlayers[5]));
  const starterCount = liveStarters.filter(Boolean).length;
  const tierEntries: Array<[Tier, number]> = liveValidation
    ? (Object.entries(liveValidation.tierCounts) as Array<[Tier, number]>)
    : [
        ['T1', 1],
        ['T2', 0],
        ['T3', 4],
        ['T4', 1],
      ];
  const teamName = actualTeam?.name ?? 'Void Hunters';
  const teamStatus = actualTeam?.status ?? (submitted ? 'submitted' : 'draft');
  const isSubmitted =
    submitted || teamStatus === 'submitted' || Boolean(submitState.success);
  const isCaptain = Boolean(
    actualTeam &&
    currentRegistrationId &&
    actualTeam.members.some(
      (member) =>
        member.registrationId === currentRegistrationId && member.isCaptain,
    ),
  );
  const changesClosed = deadlineStatus === 'passed';
  const showCaptainControls = (preview || isCaptain) && !changesClosed;
  const canRename = preview || (isCaptain && !changesClosed);
  const inviteOptions = participants
    ? availableTournamentParticipants(
        participants,
        actualTeam?.members.map((member) => member.registrationId),
        actualTeam?.invites
          .filter((invite) => invite.status === 'pending')
          .map((invite) => invite.invitedRegistrationId),
      )
    : undefined;
  const pendingInvites =
    actualTeam?.invites.filter((invite) => invite.status === 'pending') ?? [];
  const pendingJoinRequests =
    actualTeam?.joinRequests.filter(
      (request) => request.status === 'pending',
    ) ?? [];

  function submitPreviewTeam() {
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  }

  return (
    <PageFrame className={!isSubmitted ? 'pb-10' : undefined}>
      <div className='flex flex-col gap-[18px]'>
        <div className='flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:justify-between'>
          <div>
            <Kicker className='text-primary'>TEAM ROOM</Kicker>
            <h1 className='mt-1 font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground desktop:text-[34px]'>
              {teamName}.
            </h1>
            <p className='mt-1 text-[11px] text-secondary-foreground desktop:text-sm'>
              <span className='desktop:hidden'>
                Captain{' '}
                {actualTeam?.members.find((member) => member.isCaptain)
                  ?.displayName ?? 'Captain'}{' '}
                - {isSubmitted ? 'submitted roster' : 'draft roster'} -{' '}
                {starterCount} / 5 starters
              </span>
              <span className='hidden desktop:inline'>
                Captain{' '}
                {actualTeam?.members.find((member) => member.isCaptain)
                  ?.displayName ?? 'Captain'}{' '}
                - {isSubmitted ? 'submitted roster' : 'draft roster'} -{' '}
                {liveMembers.length} members - {starterCount}{' '}
                {starterCount === 1 ? 'starter' : 'starters'}
              </span>
            </p>
          </div>
          {!isSubmitted && showCaptainControls ? (
            <div className='flex flex-wrap gap-2'>
              <ButtonLink
                className='min-h-10 rounded-xl px-3.5 py-2.5 text-xs shadow-primary/15'
                href='#team-activity'
              >
                <Plus aria-hidden='true' size={15} /> Invite player
              </ButtonLink>
              <ButtonLink
                className='min-h-10 rounded-lg border border-border-strong bg-transparent px-3 py-2.5 text-xs font-bold text-secondary-foreground hover:bg-secondary'
                href='#team-activity'
                variant='secondary'
              >
                Review request
              </ButtonLink>
              {canRename ? (
                <Button
                  className='min-h-10 rounded-lg border border-border-strong bg-transparent px-3 py-2.5 text-xs font-bold text-secondary-foreground hover:bg-secondary'
                  onClick={() => setRenaming((current) => !current)}
                  size='lg'
                  type='button'
                  variant='outline'
                >
                  {renaming ? (
                    'Cancel'
                  ) : (
                    <>
                      Rename <span className='hidden desktop:inline'>team</span>
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {isSubmitted ? (
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            initial={{ opacity: 0, transform: 'translateY(8px) scale(0.99)' }}
            transition={{ duration: 0.22, ease: easeOutExpo }}
          >
            <Card
              className='border-success/30 bg-success-soft/70 p-5 desktop:p-6'
              aria-live='polite'
            >
              <div className='flex items-start gap-4'>
                <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-success/12 text-success'>
                  <LockKeyhole size={21} />
                </span>
                <div>
                  <Kicker className='text-success'>ROSTER SUBMITTED</Kicker>
                  <h2 className='mt-2 font-display text-xl font-bold'>
                    Participant editing is locked
                  </h2>
                  <p className='mt-2 max-w-2xl text-sm leading-5 text-secondary-foreground'>
                    This is the roster the organizer will review. Only the
                    organizer can unlock it for another participant edit.
                  </p>
                </div>
              </div>
            </Card>
            <Card className='border-success/25 bg-card p-5 desktop:p-6'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <Kicker className='text-success'>SUBMISSION RECEIPT</Kicker>
                  <h2 className='mt-2 font-display text-xl font-bold'>
                    Valid roster accepted
                  </h2>
                  <p className='mt-2 text-sm leading-5 text-secondary-foreground'>
                    {actualTeam?.submittedAt
                      ? `Submitted ${new Date(actualTeam.submittedAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}.`
                      : 'Your five starters and approved tier limits passed validation.'}
                  </p>
                </div>
                <span
                  className='grid size-11 place-items-center rounded-xl bg-success-soft text-success'
                  aria-hidden='true'
                >
                  <CheckCircle2 size={21} />
                </span>
              </div>
              <div className='mt-5 grid gap-3 border-t border-border pt-4 text-sm tablet:grid-cols-3'>
                <div>
                  <Kicker>STARTERS</Kicker>
                  <p className='mt-1 font-semibold'>
                    {liveStarters.filter(Boolean).length} / 5
                  </p>
                </div>
                <div>
                  <Kicker>SUBSTITUTES</Kicker>
                  <p className='mt-1 font-semibold'>{substituteCount} / 2</p>
                </div>
                <div>
                  <Kicker>STATUS</Kicker>
                  <p className='mt-1 font-semibold text-success'>
                    LOCKED FOR REVIEW
                  </p>
                </div>
              </div>
              <p className='mt-5 border-t border-border pt-4 text-sm leading-5 text-secondary-foreground'>
                Need a change? Ask the organizer to unlock the team. Participant
                edits stay disabled until then.
              </p>
            </Card>
          </motion.div>
        ) : (
          <>
            {changesClosed ? (
              <Alert className='mt-4 border-danger/30 bg-danger-soft text-danger'>
                <AlertDescription className='text-danger'>
                  Team changes are closed because the registration deadline has
                  passed.
                </AlertDescription>
              </Alert>
            ) : null}
            {renaming && canRename && !renameState.success ? (
              <form
                action={renameAction}
                className='mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-4 tablet:flex-row tablet:items-end'
                onSubmit={
                  preview
                    ? (event) => {
                        event.preventDefault();
                        setRenaming(false);
                      }
                    : undefined
                }
              >
                <input
                  name='teamId'
                  type='hidden'
                  value={actualTeam?.id ?? 'preview-team'}
                />
                <Field className='min-w-0 flex-1'>
                  <FieldLabel htmlFor='team-name'>Team name</FieldLabel>
                  <Input
                    defaultValue={teamName}
                    id='team-name'
                    maxLength={60}
                    name='teamName'
                    required
                  />
                </Field>
                <FormSubmitButton className='bg-primary text-primary-foreground hover:bg-primary-hover'>
                  Save name
                </FormSubmitButton>
              </form>
            ) : null}
            {renameState.error ? (
              <Alert aria-live='polite' className='mt-4' variant='destructive'>
                <AlertDescription>{renameState.error}</AlertDescription>
              </Alert>
            ) : null}
            {renameState.success ? (
              <Alert
                aria-live='polite'
                className='mt-4 border-success/30 bg-success-soft text-success'
              >
                <AlertDescription className='text-success'>
                  {renameState.success}
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        )}

        <div className='grid grid-cols-2 gap-4'>
          <div className='contents'>
            <LineupEditor
              className='desktop:col-span-2'
              currentRegistrationId={currentRegistrationId}
              deadlineStatus={deadlineStatus}
              onAssignmentsChange={setLineupDraft}
              preview={preview}
              team={actualTeam ?? previewTeam}
            />

            {!isSubmitted ? (
              <Card
                className='bg-secondary p-3.5 desktop:p-4.5 h-fit'
                id='team-activity'
              >
                <div className='flex items-center justify-between gap-3'>
                  <Kicker>INVITES & REQUESTS</Kicker>
                  <h2 className='sr-only'>Captain inbox</h2>
                  <span className='text-[11px] text-primary'>
                    {pendingInvites.length + pendingJoinRequests.length} waiting
                  </span>
                </div>
                {isCaptain &&
                !changesClosed &&
                inviteOptions &&
                inviteOptions.length > 0 ? (
                  <form
                    action={inviteAction}
                    className='mt-3 flex flex-col gap-3'
                  >
                    <input
                      name='teamId'
                      type='hidden'
                      value={actualTeam?.id ?? ''}
                    />
                    <Field className='min-w-0 flex-1'>
                      <FieldLabel htmlFor='invitedRegistrationId'>
                        Invite a registered player
                      </FieldLabel>
                      <FieldDescription>
                        Select from players without a team.
                      </FieldDescription>
                      <NativeSelect
                        className='mt-2 w-full rounded-lg'
                        id='invitedRegistrationId'
                        name='invitedRegistrationId'
                        defaultValue=''
                      >
                        <NativeSelectOption disabled value=''>
                          Choose a player
                        </NativeSelectOption>
                        {inviteOptions.map((participant) => (
                          <NativeSelectOption
                            key={participant.id}
                            value={participant.id}
                          >
                            {participant.displayName} · {participant.riotName}#
                            {participant.riotTag}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                    <FormSubmitButton className='self-start border border-border-strong bg-transparent text-secondary-foreground hover:bg-background/30'>
                      Send invite
                    </FormSubmitButton>
                  </form>
                ) : null}
                {inviteState.error ? (
                  <Alert
                    aria-live='polite'
                    className='mt-4'
                    variant='destructive'
                  >
                    <AlertDescription>{inviteState.error}</AlertDescription>
                  </Alert>
                ) : null}
                {inviteState.success ? (
                  <Alert
                    aria-live='polite'
                    className='mt-4 border-success/30 bg-success-soft text-success'
                  >
                    <AlertDescription className='text-success'>
                      {inviteState.success}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {pendingInvites.length > 0 ? (
                  <div className='mt-4 flex flex-col gap-2 border-t border-border pt-3'>
                    {pendingInvites.map((invite) => (
                      <div className='flex items-start gap-2' key={invite.id}>
                        <Clock3
                          className='mt-0.5 shrink-0 text-primary'
                          size={14}
                        />
                        <div>
                          <p className='text-[11px] font-semibold'>
                            Invitation sent to {invite.displayName}
                          </p>
                          <p className='mt-0.5 text-[9px] text-muted-foreground'>
                            Waiting for acceptance
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {pendingJoinRequests.length > 0 ? (
                  <div className='mt-5 grid gap-3 tablet:grid-cols-2'>
                    {pendingJoinRequests.map((request) => (
                      <div
                        className='rounded-2xl border border-primary/30 bg-primary-soft p-4'
                        key={request.id}
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <Kicker className='text-primary-muted'>
                              JOIN REQUEST
                            </Kicker>
                            <p className='mt-2 text-sm font-semibold'>
                              {request.displayName} ·{' '}
                              {request.approvedTier ?? 'Pending'} ·{' '}
                              {request.primaryRole}
                            </p>
                          </div>
                          <StatusPill tone='warning'>WAITING</StatusPill>
                        </div>
                        {showCaptainControls ? (
                          <form
                            action={requestAction}
                            className='mt-4 flex gap-2'
                          >
                            <input
                              name='requestId'
                              type='hidden'
                              value={request.id}
                            />
                            <Button
                              className='min-h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary-hover'
                              name='decision'
                              size='lg'
                              type='submit'
                              value='accepted'
                            >
                              Accept
                            </Button>
                            <Button
                              className='min-h-11 flex-1 border border-border bg-secondary text-foreground hover:border-border-strong'
                              name='decision'
                              size='lg'
                              type='submit'
                              value='declined'
                            >
                              Decline
                            </Button>
                          </form>
                        ) : (
                          <p className='mt-3 text-xs leading-5 text-muted-foreground'>
                            {changesClosed
                              ? 'The deadline has passed. The captain can no longer resolve requests.'
                              : 'Only the team captain can resolve requests.'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : preview ? (
                  <div className='mt-5 grid gap-3 tablet:grid-cols-2'>
                    <div className='rounded-2xl border border-border bg-secondary p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <Kicker>TEAM INVITE</Kicker>
                          <p className='mt-2 text-sm font-semibold'>Kai#2288</p>
                        </div>
                        <StatusPill>WAITING</StatusPill>
                      </div>
                      <p className='mt-3 text-xs leading-5 text-muted-foreground'>
                        The invite expires when Kai joins another team.
                      </p>
                    </div>
                    <div className='rounded-2xl border border-primary/30 bg-primary-soft p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <Kicker className='text-primary-muted'>
                            JOIN REQUEST
                          </Kicker>
                          <p className='mt-2 text-sm font-semibold'>
                            Niko#8128 · T2 · Mid
                          </p>
                        </div>
                        <StatusPill
                          tone={
                            requestState === 'accepted'
                              ? 'success'
                              : requestState === 'declined'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {requestState.toUpperCase()}
                        </StatusPill>
                      </div>
                      {requestState === 'pending' ? (
                        <div className='mt-4 flex gap-2'>
                          <Button
                            className='min-h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary-hover'
                            onClick={() => setRequestState('accepted')}
                            size='lg'
                            type='button'
                          >
                            Accept
                          </Button>
                          <Button
                            className='min-h-11 flex-1 border border-border bg-secondary text-foreground hover:border-border-strong'
                            onClick={() => setRequestState('declined')}
                            size='lg'
                            type='button'
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <p className='mt-3 text-xs text-secondary-foreground'>
                          Request {requestState}.
                        </p>
                      )}
                    </div>
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <p className='mt-5 text-sm text-muted-foreground'>
                    No pending invites or join requests.
                  </p>
                ) : null}
                {requestActionState.error ? (
                  <Alert
                    aria-live='polite'
                    className='mt-4'
                    variant='destructive'
                  >
                    <AlertDescription>
                      {requestActionState.error}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {requestActionState.success ? (
                  <Alert
                    aria-live='polite'
                    className='mt-4 border-success/30 bg-success-soft text-success'
                  >
                    <AlertDescription className='text-success'>
                      {requestActionState.success}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </Card>
            ) : null}
          </div>

          <aside className='flex flex-col gap-5 row-span-2 '>
            <Card className='p-5'>
              <Kicker>ROSTER VALIDATION</Kicker>
              <div
                className={cn(
                  'mt-4 rounded-xl border p-4',
                  liveValidation?.valid === false
                    ? 'border-danger/25 bg-danger-soft'
                    : 'border-success/25 bg-success-soft',
                )}
              >
                <div
                  className={cn(
                    'flex items-start gap-2.5',
                    liveValidation?.valid === false
                      ? 'text-danger'
                      : 'text-success',
                  )}
                >
                  {liveValidation?.valid === false ? (
                    <AlertTriangle className='mt-0.5 shrink-0' size={18} />
                  ) : (
                    <CheckCircle2 className='mt-0.5 shrink-0' size={18} />
                  )}
                  <div>
                    <p className='m-0 text-sm font-semibold'>
                      {liveValidation?.valid === false
                        ? 'Blocking issues'
                        : 'No blocking issues'}
                    </p>
                    {liveValidation?.valid === false ? (
                      <ul className='mt-1 mb-0 list-disc space-y-1 pl-4 text-xs leading-5 text-secondary-foreground'>
                        {liveValidation.blockingIssues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className='mt-1 text-xs leading-5 text-secondary-foreground'>
                        Five starters, approved tiers, and tier caps all pass.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {(liveValidation?.warnings.length ?? 1) > 0 ? (
                <div className='mt-3 rounded-xl border border-warning/25 bg-warning-soft p-4'>
                  <div className='flex items-start gap-2.5 text-warning'>
                    <AlertTriangle className='mt-0.5 shrink-0' size={18} />
                    <div>
                      <p className='m-0 text-sm font-semibold'>Role warnings</p>
                      <ul className='mt-1 mb-0 list-disc space-y-1 pl-4 text-xs leading-5 text-secondary-foreground'>
                        {(
                          liveValidation?.warnings ?? [
                            'Mori prefers Baron or Support, not Dragon.',
                          ]
                        ).map((warning) => (
                          <li key={warning}>
                            {warning} This does not block submission.
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className='mt-5 border-t border-border pt-4'>
                <Kicker>FULL ROSTER TIERS</Kicker>
                <div className='mt-3 flex flex-wrap gap-2'>
                  {tierEntries
                    .filter(([, count]) => count > 0)
                    .map(([tier, count]) => (
                      <span
                        className={cn('text-sm', tierMeta[tier].text)}
                        key={tier}
                      >
                        {count} × {tier}
                      </span>
                    ))}
                </div>
              </div>
              {!isSubmitted && showCaptainControls ? (
                <div className='mt-5 border-t border-border pt-5'>
                  {preview ? (
                    <>
                      <Button
                        className='hidden min-h-11 w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover desktop:inline-flex'
                        onClick={submitPreviewTeam}
                        size='lg'
                        type='button'
                      >
                        <ShieldCheck size={17} /> Submit team
                      </Button>
                      <p className='mt-3 mb-0 hidden text-center text-xs leading-5 text-muted-foreground desktop:block'>
                        Submission locks participant editing.
                      </p>
                    </>
                  ) : (
                    <form
                      action={submitAction}
                      onSubmit={() => window.scrollTo({ top: 0 })}
                    >
                      <input
                        name='teamId'
                        type='hidden'
                        value={actualTeam?.id ?? ''}
                      />
                      <FormSubmitButton className='hidden w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover desktop:inline-flex'>
                        <ShieldCheck size={17} /> Submit team
                      </FormSubmitButton>
                      <p className='mt-3 mb-0 hidden text-center text-xs leading-5 text-muted-foreground desktop:block'>
                        Submission locks participant editing.
                      </p>
                    </form>
                  )}
                </div>
              ) : null}
              {submitState.error ? (
                <Alert
                  aria-live='polite'
                  className='mt-4'
                  variant='destructive'
                >
                  <AlertDescription>
                    <span className='font-semibold'>{submitState.error}</span>
                    {submitState.blockingIssues?.map((issue) => (
                      <span
                        className='mt-2 block text-xs text-secondary-foreground'
                        key={issue}
                      >
                        {issue}
                      </span>
                    ))}
                  </AlertDescription>
                </Alert>
              ) : null}
            </Card>
          </aside>
          {actualTeam ? (
            <TeamMembershipControls
              currentRegistrationId={currentRegistrationId}
              deadlineStatus={deadlineStatus}
              team={actualTeam}
            />
          ) : null}
        </div>
      </div>
    </PageFrame>
  );
}

export function TournamentTeamRoute(props: TournamentAppProps) {
  const {
    deadlineStatus = defaultSettings.deadlineStatus,
    incomingInvites,
    participants,
    registration,
    team,
  } = props;

  return (
    <TournamentAppRouteFrame {...props}>
      <TeamRoomView
        currentRegistrationId={props.currentRegistrationId}
        deadlineStatus={deadlineStatus}
        incomingInvites={incomingInvites}
        initialSubmitted={props.view === 'submitted'}
        participants={participants}
        registration={registration}
        team={team}
      />
    </TournamentAppRouteFrame>
  );
}
