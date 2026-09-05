"use client";

import { OrganizerLineup } from "@/components/tournament/organizer-lineup";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, LockKeyhole, ShieldCheck, Trash2, Wrench } from "lucide-react";

import {
  addTeamMember,
  organizerUpdateTeamLineup,
  removeTeamMember,
  unlockSubmittedTeam,
  type TeamAdminState,
} from "@/app/admin/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RoleIcon } from "@/components/tournament/role-icon";
import {
  availableTournamentParticipants,
  starterRoles,
  validateRoster,
} from "@/lib/tournament-rules";
import type {
  TournamentMemberData,
  TournamentParticipantOption,
  TournamentTeamData,
  TournamentRole,
  TournamentTier,
} from "@/lib/tournament-types";
import { cn } from "@/lib/utils";
import { AnimatedButtonLabel } from "@/components/ui/animated-button-label";
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
} from "@/components/ui/alert-dialog";

type LineupEntry = {
  registrationId: string;
  lineupPosition: "starter" | "substitute";
  starterRole: TournamentRole | null;
};

const roleOptions = [...starterRoles];
const tierOptions = ["T1", "T2", "T3", "T4"] as const satisfies readonly TournamentTier[];

const tierBadgeClasses = {
  T1: "border-tier-t1/35 bg-tier-t1/12 text-tier-t1",
  T2: "border-tier-t2/35 bg-tier-t2/12 text-tier-t2",
  T3: "border-tier-t3/35 bg-tier-t3/12 text-tier-t3",
  T4: "border-tier-t4/35 bg-tier-t4/12 text-tier-t4",
} as const;

function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button className={cn("min-h-11 rounded-xl px-3.5 py-2 text-sm font-bold", className)} disabled={pending} size="lg" type="submit">
      <AnimatedButtonLabel stateKey={pending ? "pending" : "ready"}>
        {pending ? "Saving..." : children}
      </AnimatedButtonLabel>
    </Button>
  );
}

function TierBadge({ tier }: { tier: TournamentMemberData["approvedTier"] }) {
  return tier ? (
    <Badge className={cn("h-auto min-h-6 min-w-9 rounded-lg border px-2 py-1 font-mono text-2xs font-bold", tierBadgeClasses[tier])}>
      {tier}
    </Badge>
  ) : (
    <Badge className="h-auto min-h-6 rounded-lg border border-warning/25 bg-warning-soft px-2 py-1 font-mono text-2xs font-bold text-warning">
      PENDING
    </Badge>
  );
}

function memberLineup(team: TournamentTeamData): LineupEntry[] {
  return team.members.map((member) => ({
    registrationId: member.registrationId,
    lineupPosition: member.lineupPosition,
    starterRole: member.starterRole,
  }));
}

function memberDisplay(member: TournamentMemberData) {
  return `${member.riotName}#${member.riotTag}`;
}

function RemoveMemberDialog({
  member,
  removeAction,
  teamId,
  teamName,
}: {
  member: TournamentMemberData;
  removeAction: (formData: FormData) => void;
  teamId: string;
  teamName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger
        aria-label={`Remove ${member.displayName}`}
        render={<Button className="border border-border text-muted-foreground hover:border-danger/40 hover:bg-danger-soft hover:text-danger" size="icon-lg" />}
      >
        <Trash2 size={15} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {member.displayName} from {teamName}?</AlertDialogTitle>
          <AlertDialogDescription>
            They will lose this roster spot. If the submitted roster becomes invalid, the team returns to draft.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep player</AlertDialogCancel>
          <form action={removeAction} onSubmit={() => setOpen(false)}>
            <input name="teamId" type="hidden" value={teamId} />
            <input name="registrationId" type="hidden" value={member.registrationId} />
            <AlertDialogAction type="submit" variant="destructive">Remove player</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TeamCard({
  participants,
  team,
}: {
  participants: TournamentParticipantOption[];
  team: TournamentTeamData;
}) {
  const [lineup, setLineup] = useState<LineupEntry[]>(() => memberLineup(team));
  const [lineupState, lineupAction, lineupPending] = useActionState<TeamAdminState, FormData>(
    organizerUpdateTeamLineup,
    {},
  );
  const [addState, addAction] = useActionState<TeamAdminState, FormData>(
    addTeamMember,
    {},
  );
  const [removeState, removeAction] = useActionState<TeamAdminState, FormData>(
    removeTeamMember,
    {},
  );
  const [unlockState, unlockAction] = useActionState<TeamAdminState, FormData>(
    unlockSubmittedTeam,
    {},
  );

  const lineupByRegistration = useMemo(
    () => new Map(lineup.map((entry) => [entry.registrationId, entry])),
    [lineup],
  );
  const validation = useMemo(
    () =>
      validateRoster(
        team.members.map((member) => {
          const entry = lineupByRegistration.get(member.registrationId);
          return {
            displayName: member.displayName,
            approvedTier: member.approvedTier,
            lineupPosition: entry?.lineupPosition ?? member.lineupPosition,
            starterRole: entry ? entry.starterRole : member.starterRole,
            primaryRole: member.primaryRole,
            secondaryRole: member.secondaryRole,
          };
        }),
      ),
    [lineupByRegistration, team.members],
  );

  const availableParticipants = availableTournamentParticipants(participants);
  const tierTotals = team.members.reduce<Record<TournamentTier, number>>(
    (totals, member) => {
      if (member.approvedTier) {
        totals[member.approvedTier] += 1;
      }
      return totals;
    },
    { T1: 0, T2: 0, T3: 0, T4: 0 },
  );

  function updateLineup(
    registrationId: string,
    changes: Partial<LineupEntry>,
  ) {
    setLineup((current) =>
      current.map((entry) => {
        if (entry.registrationId !== registrationId) {
          return entry;
        }

        const lineupPosition = changes.lineupPosition ?? entry.lineupPosition;
        if (lineupPosition === "substitute") {
          return { ...entry, ...changes, lineupPosition, starterRole: null };
        }

        return {
          ...entry,
          ...changes,
          lineupPosition,
          starterRole: changes.starterRole ?? entry.starterRole ?? "Baron",
        };
      }),
    );
  }

  const statusIsSubmitted = team.status === "submitted";
  return (
    <Card className="rounded-2xl border border-border bg-card gap-0 p-5 desktop:p-6" role="article">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="m-0 font-display text-2xl font-bold tracking-[-0.03em]">
              {team.name}
            </h2>
            <Badge
              className={cn(
                "h-auto min-h-7 rounded-full border px-2.5 py-1 font-mono text-2xs font-semibold tracking-[0.08em]",
                statusIsSubmitted
                  ? "border-success/25 bg-success-soft text-success"
                  : "border-warning/25 bg-warning-soft text-warning",
              )}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {team.status.toUpperCase()}
            </Badge>
          </div>
          <p className="mt-2 mb-0 text-sm text-secondary-foreground">
            {team.members.length} / 7 members · captain {team.members.find((member) => member.isCaptain)?.displayName ?? "not assigned"}
            {team.submittedAt
              ? ` · submitted ${new Date(team.submittedAt).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
              : " · draft roster"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tierOptions.map((tier) => (
              <Badge className="h-auto rounded-lg border border-border bg-secondary px-2 py-1 font-mono text-2xs font-semibold text-secondary-foreground" key={tier}>
                {tier} × {tierTotals[tier]}
              </Badge>
            ))}
          </div>
        </div>

        {statusIsSubmitted ? (
          <div className="flex min-w-52 flex-col items-end gap-2">
            <form action={unlockAction}>
              <input name="teamId" type="hidden" value={team.id} />
              <SubmitButton className="border border-warning/30 bg-warning-soft text-warning hover:bg-warning/15">
                <LockKeyhole size={16} /> Unlock team
              </SubmitButton>
            </form>
            {unlockState.error ? <p aria-live="polite" className="m-0 max-w-64 text-right text-xs text-danger">{unlockState.error}</p> : null}
            {unlockState.success ? <p aria-live="polite" className="m-0 max-w-64 text-right text-xs text-success">{unlockState.success}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5">
        <section className="order-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
                CURRENT ROSTER
              </p>
              <h3 className="mt-2 mb-0 font-display text-lg font-bold">Members and roles</h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {validation.valid ? "READY" : `${validation.blockingIssues.length} BLOCKERS`}
            </span>
          </div>

          <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {team.members.map((member) => {
              const entry = lineupByRegistration.get(member.registrationId);
              return (
                <div className="flex flex-wrap items-center gap-3 p-3.5" key={member.id}>
                  <Avatar className="size-9">
                    <AvatarFallback className="rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground">
                    {member.displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-36 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="m-0 text-sm font-semibold">{member.displayName}</p>
                      {member.isCaptain ? (
                        <span className="font-mono text-2xs font-semibold tracking-widest text-primary-muted">CAPTAIN</span>
                      ) : null}
                    </div>
                    <div className="mt-1 mb-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                      <span>{memberDisplay(member)} · prefers</span>
                      <span className="inline-flex items-center gap-1.5"><RoleIcon className="size-3.5" roleName={member.primaryRole} />{member.primaryRole}</span>
                      <span aria-hidden="true">/</span>
                      <span className="inline-flex items-center gap-1.5"><RoleIcon className="size-3.5" roleName={member.secondaryRole} />{member.secondaryRole}</span>
                    </div>
                  </div>
                  <TierBadge tier={member.approvedTier} />
                  <span className="min-w-20 text-right text-xs text-secondary-foreground">
                    {entry?.lineupPosition === "starter" && entry.starterRole ? <span className="inline-flex items-center gap-1.5"><RoleIcon className="size-3.5" roleName={entry.starterRole} />{entry.starterRole}</span> : "Substitute"}
                  </span>
                  {!member.isCaptain ? (
                    <RemoveMemberDialog
                      member={member}
                      removeAction={removeAction}
                      teamId={team.id}
                      teamName={team.name}
                    />
                  ) : (
                    <span className="size-9" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
          {removeState.error ? <Alert aria-live="polite" className="mt-3" variant="destructive"><AlertDescription>{removeState.error}</AlertDescription></Alert> : null}
          {removeState.success ? <Alert aria-live="polite" className="mt-3 border-success/30 bg-success-soft text-success"><AlertDescription className="text-success">{removeState.success}</AlertDescription></Alert> : null}
          {removeState.blockingIssues?.map((issue) => <p aria-live="polite" className="mt-2 mb-0 text-xs text-secondary-foreground" key={issue}>{issue}</p>)}
        </section>

        <section className="order-1 rounded-xl border border-border bg-secondary/45 p-4">
          <div className="flex items-start gap-3">
            <Wrench className="mt-0.5 shrink-0 text-primary-muted" size={18} />
            <div>
              <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-primary-muted">
                ORGANIZER REPAIR
              </p>
              <h3 className="mt-2 mb-0 font-display text-lg font-bold">Arrange lineup</h3>
              <p className="mt-2 mb-0 text-xs leading-5 text-secondary-foreground">
                Saving a valid lineup keeps a submitted team submitted. Any remaining blocker reopens it for the captain.
              </p>
            </div>
          </div>

          <form action={lineupAction} className="mt-4 flex flex-col gap-3">
            <input name="teamId" type="hidden" value={team.id} />
            <input name="lineup" type="hidden" value={JSON.stringify(lineup)} readOnly />
            <OrganizerLineup members={team.members} lineup={lineup} onChange={setLineup} disabled={lineupPending} />
            <SubmitButton className="w-full bg-primary text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary-hover">
              <Check size={16} /> Save lineup
            </SubmitButton>
          </form>
          {lineupState.error ? <Alert aria-live="polite" className="mt-3" variant="destructive"><AlertDescription>{lineupState.error}</AlertDescription></Alert> : null}
          {lineupState.success ? <Alert aria-live="polite" className="mt-3 border-success/30 bg-success-soft text-success"><AlertDescription className="text-success">{lineupState.success}</AlertDescription></Alert> : null}

          <div
            className={cn(
              "mt-4 rounded-xl border p-3 text-xs leading-5",
              validation.valid
                ? "border-success/25 bg-success-soft text-success"
                : "border-danger/25 bg-danger-soft text-danger",
            )}
          >
            <p className="m-0 font-semibold">
              {validation.valid ? "Roster passes submission rules." : "Roster needs repair."}
            </p>
            {validation.blockingIssues.map((issue) => (
              <p className="mt-1.5 mb-0 text-secondary-foreground" key={issue}>
                {issue}
              </p>
            ))}
            {validation.warnings.map((warning) => (
              <p className="mt-1.5 mb-0 text-secondary-foreground" key={warning}>
                Note: {warning}
              </p>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 border-t border-border pt-5 desktop:grid-cols-[minmax(0,1fr)_auto] desktop:items-end">
        <div>
          <form action={addAction} className="flex flex-col gap-2 tablet:flex-row tablet:items-end">
            <input name="teamId" type="hidden" value={team.id} />
            <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add registered player
              <NativeSelect className="w-full" defaultValue="" name="registrationId" required>
                <NativeSelectOption disabled value="">
                  {availableParticipants.length > 0 ? "Choose a player" : "No unassigned players"}
                </NativeSelectOption>
                {availableParticipants.map((participant) => (
                  <NativeSelectOption key={participant.id} value={participant.id}>
                    {participant.displayName} · {participant.riotName}#{participant.riotTag}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <SubmitButton className="border border-border bg-secondary text-foreground hover:border-border-strong">
              Add substitute
            </SubmitButton>
          </form>
          {addState.error ? <Alert aria-live="polite" className="mt-3" variant="destructive"><AlertDescription>{addState.error}</AlertDescription></Alert> : null}
          {addState.success ? <Alert aria-live="polite" className="mt-3 border-success/30 bg-success-soft text-success"><AlertDescription className="text-success">{addState.success}</AlertDescription></Alert> : null}
          {addState.blockingIssues?.map((issue) => <p aria-live="polite" className="mt-2 mb-0 text-xs text-secondary-foreground" key={issue}>{issue}</p>)}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={15} />
          Affected players and captains receive a named organizer notification.
        </div>
      </div>
    </Card>
  );
}

export function OrganizerTeamManager({
  participants,
  teams,
}: {
  participants: TournamentParticipantOption[];
  teams: TournamentTeamData[];
}) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "");
  const selectedTeam =
    teams.find((team) => team.id === selectedTeamId) ?? teams[0];

  return (
    <main className="w-full px-[18px] py-[22px] desktop:ml-[244px] desktop:w-[calc(100%-244px)] desktop:px-[34px] desktop:py-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="m-0 font-mono text-2xs font-semibold tracking-[0.14em] text-primary-muted">
              TEAM OVERSIGHT
            </p>
            <h1 className="mt-2 mb-0 max-w-3xl text-balance font-display text-[28px] font-bold leading-[1.1] tracking-[-0.035em] desktop:text-[31px]">
              Keep every roster tournament-ready
            </h1>
            <p className="mt-3 mb-0 max-w-2xl text-base leading-6 text-secondary-foreground">
              Review live team membership, repair lineup slots, and unlock submissions when a registration change makes a roster invalid.
            </p>
          </div>
          <span className="rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-2xs font-semibold tracking-[0.1em] text-muted-foreground">
            {teams.length} {teams.length === 1 ? "TEAM" : "TEAMS"}
          </span>
        </div>

        {teams.length === 0 ? (
          <Empty className="rounded-2xl border border-dashed border-border-strong bg-card p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon"><UsersIcon /></EmptyMedia>
              <EmptyTitle className="font-display text-2xl font-bold">No teams yet</EmptyTitle>
              <EmptyDescription>Team cards will appear here as participants create their rosters.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid items-start gap-4 desktop:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="overflow-x-auto rounded-xl border border-border bg-card p-2 desktop:sticky desktop:top-24 desktop:overflow-visible">
              <p className="px-2 pt-2 pb-3 font-mono text-[9px] font-semibold tracking-[0.16em] text-muted-foreground">
                TEAM LIST
              </p>
              <div className="flex min-w-max gap-2 desktop:min-w-0 desktop:flex-col">
                {teams.map((team) => {
                  const teamValidation = validateRoster(
                    team.members.map((member) => ({
                      displayName: member.displayName,
                      approvedTier: member.approvedTier,
                      lineupPosition: member.lineupPosition,
                      starterRole: member.starterRole,
                      primaryRole: member.primaryRole,
                      secondaryRole: member.secondaryRole,
                    })),
                  );
                  const selected = team.id === selectedTeam?.id;

                  return (
                    <button
                      aria-pressed={selected}
                      className={cn(
                        "min-w-48 rounded-lg border px-3 py-3 text-left transition-[background-color,border-color,transform] duration-150 active:translate-y-px desktop:min-w-0",
                        selected
                          ? "border-danger/25 bg-danger-soft"
                          : "border-transparent bg-transparent hover:border-border hover:bg-secondary",
                      )}
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      type="button"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold">{team.name}</span>
                        <span className={cn("font-mono text-[9px] font-bold", teamValidation.valid ? "text-success" : "text-danger")}>
                          {teamValidation.valid ? "READY" : `${teamValidation.blockingIssues.length} BLOCKERS`}
                        </span>
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        {team.members.length} / 7 members. Captain {team.members.find((member) => member.isCaptain)?.displayName ?? "not assigned"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {selectedTeam ? (
              <TeamCard
                key={`${selectedTeam.id}:${selectedTeam.status}:${selectedTeam.submittedAt ?? ""}:${selectedTeam.members
                  .map(
                    (member) =>
                      `${member.registrationId}-${member.lineupPosition}-${member.starterRole ?? ""}`,
                  )
                  .join("|")}`}
                participants={participants}
                team={selectedTeam}
              />
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}

function UsersIcon() {
  return (
    <div className="mx-auto grid size-12 place-items-center rounded-xl bg-primary-soft text-primary-muted">
      <ShieldCheck size={21} />
    </div>
  );
}
