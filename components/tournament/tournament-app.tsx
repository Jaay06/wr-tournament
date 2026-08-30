"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { FormEvent, ReactNode } from "react";
import { useActionState } from "react";
import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Crown,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Swords,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";

import {
  approveRegistrationTier,
  createTeam,
  inviteParticipant,
  markAllNotificationsRead,
  requestToJoinTeam,
  respondToJoinRequest,
  savePlayerRegistration,
  submitTeam,
  updateTeamLineup,
  type TournamentActionState,
} from "@/app/tournament/actions";
import { validateRoster } from "@/lib/tournament-rules";
import { cn } from "@/lib/utils";
import type {
  TierReviewData,
  TournamentDashboardData,
  TournamentMemberData,
  TournamentParticipantOption,
  TournamentRegistrationData,
  TournamentTeamData,
  TournamentTeamSummary,
  OrganizerOverviewData,
} from "@/lib/tournament-types";

export type TournamentView =
  | "registration"
  | "dashboard"
  | "teams"
  | "builder"
  | "submitted"
  | "admin"
  | "tier-review";

type Tier = "T1" | "T2" | "T3" | "T4";
type Role = "Baron" | "Jungle" | "Mid" | "Dragon" | "Support";
type StatusTone = "neutral" | "primary" | "success" | "warning" | "danger";

export type TournamentAppProps = {
  view: TournamentView;
  tournamentName?: string;
  region?: string;
  deadline?: string;
  userName?: string;
  showSignOut?: boolean;
  registration?: TournamentRegistrationData | null;
  teams?: TournamentTeamSummary[];
  team?: TournamentTeamData | null;
  tierReview?: TierReviewData | null;
  currentRegistrationId?: string;
  dashboard?: TournamentDashboardData;
  overview?: OrganizerOverviewData;
  participants?: TournamentParticipantOption[];
};

type Player = {
  name: string;
  riotId: string;
  rank: string;
  tier: Tier;
  tierStatus?: "pending" | "approved";
  primaryRole: Role;
  secondaryRole: Role;
  initial: string;
  avatarClass: string;
};

function playerFromMember(member: TournamentMemberData): Player {
  const tier = member.approvedTier ?? "T4";
  const avatarClass = member.approvedTier
    ? tierMeta[member.approvedTier].soft.replace("bg-", "bg-") + " " + tierMeta[member.approvedTier].text
    : "bg-secondary text-secondary-foreground";

  return {
    name: member.displayName,
    riotId: `${member.riotName}#${member.riotTag}`,
    rank: member.currentRank,
    tier,
    tierStatus: member.tierStatus,
    primaryRole: member.primaryRole,
    secondaryRole: member.secondaryRole,
    initial: member.displayName.slice(0, 1).toUpperCase(),
    avatarClass,
  };
}

const defaultSettings = {
  tournamentName: "Rift Clash VI",
  region: "EU West",
  deadline: "Sep 6, 2026 · 23:59 UTC",
};

const tierMeta: Record<
  Tier,
  { range: string; badge: string; border: string; soft: string; text: string }
> = {
  T1: {
    range: "Sovereign through Challenger",
    badge: "border-tier-t1/35 bg-tier-t1/12 text-tier-t1",
    border: "border-tier-t1/35",
    soft: "bg-tier-t1/10",
    text: "text-tier-t1",
  },
  T2: {
    range: "Grandmaster through Master",
    badge: "border-tier-t2/35 bg-tier-t2/12 text-tier-t2",
    border: "border-tier-t2/35",
    soft: "bg-tier-t2/10",
    text: "text-tier-t2",
  },
  T3: {
    range: "Diamond",
    badge: "border-tier-t3/35 bg-tier-t3/12 text-tier-t3",
    border: "border-tier-t3/35",
    soft: "bg-tier-t3/10",
    text: "text-tier-t3",
  },
  T4: {
    range: "Emerald and below",
    badge: "border-tier-t4/35 bg-tier-t4/12 text-tier-t4",
    border: "border-tier-t4/35",
    soft: "bg-tier-t4/10",
    text: "text-tier-t4",
  },
};

const rosterPlayers: Player[] = [
  {
    name: "Akin",
    riotId: "Akin#1701",
    rank: "Challenger",
    tier: "T1",
    primaryRole: "Baron",
    secondaryRole: "Mid",
    initial: "A",
    avatarClass: "bg-tier-t1 text-background",
  },
  {
    name: "Pix",
    riotId: "Pix#1808",
    rank: "Emerald I",
    tier: "T4",
    primaryRole: "Jungle",
    secondaryRole: "Dragon",
    initial: "P",
    avatarClass: "bg-tier-t4 text-background",
  },
  {
    name: "Jinxed",
    riotId: "Jinxed#0420",
    rank: "Diamond IV",
    tier: "T3",
    primaryRole: "Mid",
    secondaryRole: "Support",
    initial: "J",
    avatarClass: "bg-primary text-primary-foreground",
  },
  {
    name: "Mori",
    riotId: "Mori#2202",
    rank: "Diamond II",
    tier: "T3",
    primaryRole: "Baron",
    secondaryRole: "Support",
    initial: "M",
    avatarClass: "bg-tier-t3 text-background",
  },
  {
    name: "Sola",
    riotId: "Sola#7712",
    rank: "Diamond III",
    tier: "T3",
    primaryRole: "Support",
    secondaryRole: "Dragon",
    initial: "S",
    avatarClass: "bg-primary-muted text-background",
  },
  {
    name: "Rey",
    riotId: "Rey#9301",
    rank: "Diamond II",
    tier: "T3",
    primaryRole: "Jungle",
    secondaryRole: "Baron",
    initial: "R",
    avatarClass: "bg-tier-t3 text-background",
  },
];

const starterSlots = ["Baron", "Jungle", "Mid", "Dragon", "Support"] as const;

const teamCards = [
  {
    name: "Night Sentinels",
    captain: "Rey#9301",
    members: "4 / 7",
    state: "DRAFT" as const,
    eligible: true,
    tiers: { T1: 0, T2: 1, T3: 2, T4: 1 },
  },
  {
    name: "Ember Guard",
    captain: "Niko#8128",
    members: "6 / 7",
    state: "DRAFT" as const,
    eligible: true,
    tiers: { T1: 1, T2: 1, T3: 3, T4: 1 },
  },
  {
    name: "Hexbound",
    captain: "Mira#4404",
    members: "5 / 7",
    state: "SUBMITTED" as const,
    eligible: false,
    tiers: { T1: 0, T2: 2, T3: 2, T4: 1 },
  },
];

const inputClass =
  "min-h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted disabled:cursor-not-allowed disabled:opacity-45";

function Brand({ href }: { href: string }) {
  return (
    <Link
      aria-label="Rift Clash home"
      className="flex min-h-11 shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted"
      href={href}
    >
      <span className="grid size-10 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
        WR
      </span>
      <span className="flex flex-col">
        <strong className="font-display text-base font-bold leading-5 tracking-[-0.025em]">
          RIFT CLASH
        </strong>
        <small className="font-mono text-3xs leading-4 tracking-[0.14em] text-muted-foreground max-phone:hidden">
          PRIVATE TOURNAMENT
        </small>
      </span>
    </Link>
  );
}

function ClientSignOutButton({ compact = false }: { compact?: boolean }) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      className={cn(
        buttonBase,
        "border border-border bg-secondary text-foreground hover:border-border-strong hover:bg-secondary/80",
        compact ? "rounded-full px-3.5 py-2 text-xs" : "w-full",
      )}
      disabled={pending}
      onClick={handleSignOut}
      type="button"
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

function AppHeader({
  view,
  region,
  userName,
  showSignOut,
}: {
  view: TournamentView;
  region: string;
  userName: string;
  showSignOut: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const organizer = view === "admin" || view === "tier-review";
  const participantItems = [
    ["dashboard", "Home", "/tournament"],
    ["teams", "Browse teams", "/tournament/teams"],
    ["builder", "Team room", "/tournament/team"],
  ] as const;
  const organizerItems = [
    ["admin", "Overview", "/admin"],
    ["tier-review", "Tier review", "/admin/tier-review"],
    ["teams-admin", "Teams", "/admin#teams"],
    ["announcements", "Announcements", "/admin#announcements"],
    ["settings", "Settings", "/admin#settings-form"],
  ] as const;
  const items = organizer ? organizerItems : participantItems;
  const activeKey = view === "submitted" ? "builder" : view;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 w-full max-w-page items-center gap-8 px-5 py-3 desktop:px-12">
        <Brand href={organizer ? "/admin" : "/tournament"} />

        <nav className="hidden items-center gap-1 desktop:flex" aria-label={organizer ? "Organizer" : "Tournament"}>
          {items.map(([key, label, href]) => (
            <Link
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-muted",
                activeKey === key && "bg-primary-soft text-primary-muted",
              )}
              href={href}
              key={key}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 desktop:flex">
          <span className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-2xs font-semibold tracking-[0.1em] text-muted-foreground">
            {organizer ? "ORGANIZER" : region.toUpperCase()}
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-muted" aria-hidden="true">
            {userName.slice(0, 1).toUpperCase()}
          </span>
          {showSignOut ? <ClientSignOutButton compact /> : null}
        </div>

        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="ml-auto inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted desktop:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-border bg-card px-5 py-4 desktop:hidden">
          <nav className="mx-auto flex max-w-page flex-col gap-1" aria-label={organizer ? "Mobile organizer" : "Mobile tournament"}>
            {items.map(([key, label, href]) => (
              <Link
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-secondary-foreground",
                  activeKey === key && "bg-primary-soft text-primary-muted",
                )}
                href={href}
                key={key}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            {showSignOut ? <div className="mt-3 border-t border-border pt-3"><ClientSignOutButton /></div> : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function PageFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("mx-auto w-full max-w-page px-5 py-7 desktop:px-12 desktop:py-10", className)}>
      {children}
    </main>
  );
}

function Card({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cn("rounded-card border border-border bg-card", className)} id={id}>
      {children}
    </section>
  );
}

function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("m-0 font-mono text-2xs font-semibold tracking-[0.14em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div>
      <Kicker className="text-primary-muted">{eyebrow}</Kicker>
      <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground desktop:text-[46px]">
        {title}
      </h1>
      {detail ? (
        <p className="mt-3 max-w-2xl text-base leading-6 text-secondary-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={cn("inline-flex min-h-6 min-w-9 items-center justify-center rounded-lg border px-2 py-1 font-mono text-2xs font-bold", tierMeta[tier].badge)}>
      {tier}
    </span>
  );
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  const tones: Record<StatusTone, string> = {
    neutral: "border-border bg-secondary text-secondary-foreground",
    primary: "border-primary/30 bg-primary-soft text-primary-muted",
    success: "border-success/25 bg-success-soft text-success",
    warning: "border-warning/25 bg-warning-soft text-warning",
    danger: "border-danger/25 bg-danger-soft text-danger",
  };

  return (
    <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-2xs font-semibold tracking-[0.08em]", tones[tone])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

function Avatar({ player, size = "size-10" }: { player: Player; size?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full font-display text-sm font-bold", player.avatarClass, size)} aria-hidden="true">
      {player.initial}
    </span>
  );
}

function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
}) {
  return (
    <Link
      className={cn(
        buttonBase,
        variant === "primary" && "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover",
        variant === "secondary" && "border border-border bg-secondary text-foreground hover:border-border-strong hover:bg-secondary/80",
        variant === "quiet" && "text-primary-muted hover:bg-primary-soft",
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

function FormSubmitButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonBase, className)}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}

function DeadlineBanner({ deadline }: { deadline: string }) {
  const open = deadline === "Open";

  return (
    <Card className="overflow-hidden border-warning/25 bg-warning-soft/70">
      <div className="grid gap-4 px-5 py-4 tablet:grid-cols-[auto_minmax(0,1fr)_auto] tablet:items-center desktop:px-6">
        <span className="grid size-11 place-items-center rounded-xl bg-warning/12 text-warning" aria-hidden="true">
          <Clock3 size={21} />
        </span>
        <div>
          <Kicker className="text-warning">{open ? "REGISTRATION IS OPEN" : "REGISTRATION CLOSES"}</Kicker>
          <p className="mt-1.5 text-sm font-semibold text-foreground">
            {open ? "The organizer has not set a closing time." : deadline}
          </p>
        </div>
        <div className="tablet:text-right">
          <p className="m-0 font-display text-xl font-bold text-warning">
            {open ? "Open" : "6 days, 14 hours"}
          </p>
          <p className="mt-1 text-xs text-secondary-foreground">
            {open ? "Participant changes remain available" : "Participant changes close then"}
          </p>
        </div>
      </div>
    </Card>
  );
}

function RegistrationView({
  tournamentName,
  region,
  deadline,
  registration,
}: {
  tournamentName: string;
  region: string;
  deadline: string;
  registration?: TournamentRegistrationData | null;
}) {
  const previewRegistration: TournamentRegistrationData = {
    id: "preview-registration",
    riotName: "Jinxed",
    riotTag: "0420",
    currentRank: "Diamond IV",
    selfAssessedTier: "T3",
    approvedTier: null,
    tierStatus: "pending",
    primaryRole: "Mid",
    secondaryRole: "Support",
  };
  const initial = registration === undefined ? previewRegistration : registration;
  const [selectedTier, setSelectedTier] = useState<Tier>(initial?.selfAssessedTier ?? "T3");
  const [primaryRole, setPrimaryRole] = useState<Role>(initial?.primaryRole ?? "Mid");
  const [secondaryRole, setSecondaryRole] = useState<Role>(initial?.secondaryRole ?? "Support");
  const [editing, setEditing] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<TournamentRegistrationData | null>(null);
  const [state, formAction] = useActionState<TournamentActionState, FormData>(
    savePlayerRegistration,
    {},
  );
  const submitted = Boolean(state.success && !editing);
  const summary = state.registration ?? submittedValues ?? initial;

  function captureSubmission(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const riotName = String(data.get("riotName") ?? "").trim();
    const riotTag = String(data.get("riotTag") ?? "").trim();
    const currentRank = String(data.get("currentRank") ?? "").trim();
    setSubmittedValues({
      id: initial?.id ?? "pending-registration",
      riotName,
      riotTag,
      currentRank,
      selfAssessedTier: selectedTier,
      approvedTier: null,
      tierStatus: "pending",
      primaryRole,
      secondaryRole,
    });
    setEditing(false);
  }

  if (submitted) {
    return (
      <PageFrame>
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <DeadlineBanner deadline={deadline} />
          <Card className="p-6 text-center desktop:p-10" aria-live="polite">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-warning-soft text-warning">
              <Clock3 size={26} />
            </span>
            <div className="mt-4"><StatusPill tone="warning">PENDING REVIEW</StatusPill></div>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-[-0.035em]">
              Registration sent
            </h1>
            <p className="mx-auto mt-3 max-w-copy text-base leading-6 text-secondary-foreground">
              {summary?.tierStatus === "approved"
                ? `Your ${summary.approvedTier} tier is still approved. You can start looking at teams now.`
                : `The organizer will review your ${summary?.selfAssessedTier ?? "selected"} self-assessment. You can start looking at teams now.`}
            </p>
            <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-secondary p-4 text-left tablet:grid-cols-3">
              <div><Kicker>RIOT ID</Kicker><p className="mt-2 text-sm font-semibold">{summary?.riotName}#{summary?.riotTag}</p></div>
              <div><Kicker>RANK</Kicker><p className="mt-2 text-sm font-semibold">{summary?.currentRank}</p></div>
              <div><Kicker>ROLES</Kicker><p className="mt-2 text-sm font-semibold">{summary?.primaryRole} · {summary?.secondaryRole}</p></div>
            </div>
            <div className="mt-6 flex flex-col justify-center gap-3 tablet:flex-row">
              <ButtonLink href="/tournament">Go to participant home <ArrowRight size={16} /></ButtonLink>
              <button className={cn(buttonBase, "border border-border bg-secondary text-foreground hover:border-border-strong")} onClick={() => setEditing(true)} type="button">
                Edit registration
              </button>
            </div>
          </Card>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <div className="flex flex-col gap-6">
        <SectionHeading
          detail={`Register for ${tournamentName} in ${region}. The organizer will confirm the tier used for team limits.`}
          eyebrow="PLAYER REGISTRATION"
          title="Tell us how you play"
        />
        <DeadlineBanner deadline={deadline} />

        <form action={formAction} className="grid items-start gap-5 desktop:grid-cols-[minmax(0,1fr)_360px]" onSubmit={captureSubmission}>
          <Card className="p-5 desktop:p-6">
            <div className="grid gap-5 tablet:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="riotName">
                Riot name
                <input className={inputClass} defaultValue={initial?.riotName ?? ""} id="riotName" name="riotName" placeholder="Your Riot name" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="riotTag">
                Riot tag
                <input className={inputClass} defaultValue={initial?.riotTag ?? ""} id="riotTag" name="riotTag" placeholder="EUW" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold tablet:col-span-2" htmlFor="currentRank">
                Current rank
                <span className="text-xs font-normal text-muted-foreground">Choose the rank shown in Wild Rift today.</span>
                <div className="relative">
                  <select className={cn(inputClass, "appearance-none pr-10")} defaultValue={initial?.currentRank ?? ""} id="currentRank" name="currentRank">
                    <option>Challenger</option>
                    <option>Grandmaster</option>
                    <option>Master</option>
                    <option>Diamond I</option>
                    <option>Diamond II</option>
                    <option>Diamond III</option>
                    <option>Diamond IV</option>
                    <option>Emerald I</option>
                    <option>Emerald II</option>
                    <option>Emerald III</option>
                    <option>Emerald IV</option>
                    <option>Platinum or below</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                </div>
              </label>
            </div>

            <fieldset className="mt-7 border-t border-border pt-6">
              <legend className="text-sm font-semibold">Self-assessed tier</legend>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Use the default mapping. The organizer makes the final call.</p>
              <div className="mt-4 grid gap-3 tablet:grid-cols-2">
                {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                  <label className={cn("flex min-h-17 cursor-pointer items-center gap-3 rounded-xl border bg-secondary p-3.5", selectedTier === tier ? "border-primary bg-primary-soft" : "border-border hover:border-border-strong")} key={tier}>
                    <input className="sr-only" checked={selectedTier === tier} name="selfAssessedTier" onChange={() => setSelectedTier(tier)} type="radio" value={tier} />
                    <TierBadge tier={tier} />
                    <span className="text-sm font-medium text-secondary-foreground">{tierMeta[tier].range}</span>
                    <span className={cn("ml-auto grid size-5 place-items-center rounded-full border", selectedTier === tier ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                      {selectedTier === tier ? <Check size={12} /> : null}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-7 grid gap-5 border-t border-border pt-6 tablet:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="primaryRole">
                Primary role
                <div className="relative">
                  <select
                    className={cn(inputClass, "appearance-none pr-10")}
                    id="primaryRole"
                    name="primaryRole"
                    onChange={(event) => {
                      const nextRole = event.target.value as Role;
                      setPrimaryRole(nextRole);
                      if (nextRole === secondaryRole) {
                        setSecondaryRole(starterSlots.find((role) => role !== nextRole) ?? "Baron");
                      }
                    }}
                    value={primaryRole}
                  >
                    {starterSlots.map((role) => <option key={role}>{role}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                </div>
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="secondaryRole">
                Secondary role
                <div className="relative">
                  <select className={cn(inputClass, "appearance-none pr-10")} id="secondaryRole" name="secondaryRole" onChange={(event) => setSecondaryRole(event.target.value as Role)} value={secondaryRole}>
                    {starterSlots.map((role) => <option disabled={role === primaryRole} key={role}>{role}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                </div>
              </label>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-border pt-6 tablet:flex-row tablet:items-center tablet:justify-between">
              <p className="m-0 max-w-md text-xs leading-5 text-muted-foreground">You can edit rank, tier, and roles until registration closes. Rank or tier changes reopen organizer review.</p>
              <FormSubmitButton className="shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover">
                Send for review <ArrowRight size={16} />
              </FormSubmitButton>
            </div>
            {state.error ? <p aria-live="polite" className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p> : null}
          </Card>

          <Card className="overflow-hidden desktop:sticky desktop:top-24">
            <div className="border-b border-border px-5 py-4">
              <Kicker>DEFAULT TIER MAP</Kicker>
              <h2 className="mt-2 font-display text-xl font-bold">Rank ranges</h2>
            </div>
            <div className="divide-y divide-border">
              {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                <div className="flex items-center gap-3 px-5 py-4" key={tier}>
                  <TierBadge tier={tier} />
                  <p className="m-0 text-sm font-medium text-secondary-foreground">{tierMeta[tier].range}</p>
                </div>
              ))}
            </div>
            <p className="m-0 border-t border-border bg-secondary px-5 py-4 text-xs leading-5 text-muted-foreground">Tier limits apply to the full roster, including substitutes. Teams may have at most one T1 and two T2 players.</p>
          </Card>
        </form>
      </div>
    </PageFrame>
  );
}

function DashboardView({
  tournamentName,
  region,
  deadline,
  userName,
  registration,
  team,
  dashboard,
}: {
  tournamentName: string;
  region: string;
  deadline: string;
  userName: string;
  registration?: TournamentRegistrationData | null;
  team?: TournamentTeamData | null;
  dashboard?: TournamentDashboardData;
}) {
  const preview = registration === undefined;
  const previewRegistration: TournamentRegistrationData = {
    id: "preview-registration",
    riotName: "Jinxed",
    riotTag: "0420",
    currentRank: "Diamond IV",
    selfAssessedTier: "T3",
    approvedTier: "T3",
    tierStatus: "approved",
    primaryRole: "Mid",
    secondaryRole: "Support",
  };
  const liveRegistration = registration === undefined ? previewRegistration : registration;
  const user = { ...rosterPlayers[2], name: userName, riotId: liveRegistration ? `${liveRegistration.riotName}#${liveRegistration.riotTag}` : `${userName}#0420`, rank: liveRegistration?.currentRank ?? "Registration incomplete", tier: liveRegistration?.approvedTier ?? liveRegistration?.selfAssessedTier ?? "T3", primaryRole: liveRegistration?.primaryRole ?? "Mid", secondaryRole: liveRegistration?.secondaryRole ?? "Support", initial: userName.slice(0, 1).toUpperCase() };
  const liveTeam = team === undefined ? null : team;
  const teamStarters = liveTeam
    ? starterSlots.map((role) => liveTeam.members.find((member) => member.lineupPosition === "starter" && member.starterRole === role))
    : rosterPlayers.slice(0, 5).map((player) => player);
  const [notificationState, markAllAction] = useActionState<TournamentActionState, FormData>(markAllNotificationsRead, {});
  const unreadCount = notificationState.success ? 0 : dashboard?.notifications.filter((notification) => notification.status === "unread").length ?? (preview ? 2 : 0);

  return (
    <PageFrame>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            detail={`${tournamentName} · ${region}`}
            eyebrow="PARTICIPANT HOME"
            title={`Welcome back, ${userName}`}
          />
          <StatusPill tone="success">REGISTRATION OPEN</StatusPill>
        </div>

        <DeadlineBanner deadline={deadline} />

        <div className="grid gap-5 desktop:grid-cols-12">
          <div className="flex flex-col gap-5 desktop:col-span-8">
            <Card className="p-5 desktop:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar player={user} size="size-13" />
                  <div>
                    <Kicker>REGISTRATION & TIER</Kicker>
                    <h2 className="mt-2 font-display text-xl font-bold">{user.riotId}</h2>
                    <p className="mt-1 text-sm text-secondary-foreground">{user.rank} · {user.primaryRole} primary · {user.secondaryRole} secondary</p>
                  </div>
                </div>
                <StatusPill tone={liveRegistration?.tierStatus === "approved" ? "success" : "warning"}>{liveRegistration ? liveRegistration.tierStatus.toUpperCase() : "NOT STARTED"}</StatusPill>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                {liveRegistration?.approvedTier ? <TierBadge tier={liveRegistration.approvedTier} /> : <StatusPill tone="warning">PENDING TIER</StatusPill>}
                <p className="m-0 text-sm text-secondary-foreground">{liveRegistration?.approvedTier ? `The organizer approved your ${liveRegistration.approvedTier} tier.` : "The organizer will review your registration before team submission."}</p>
                <ButtonLink className="ml-auto" href="/tournament/register" variant="quiet">Edit registration</ButtonLink>
              </div>
            </Card>

            {!preview && !liveTeam ? <Card className="p-5 desktop:p-6">
              <Kicker>YOUR TEAM</Kicker>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em]">No team yet</h2>
              <p className="mt-2 text-sm leading-5 text-secondary-foreground">Create a team or ask to join a draft with room.</p>
              <div className="mt-5 flex flex-col gap-3 phone:flex-row"><ButtonLink href="/tournament/team"><Plus size={16} /> Create a team</ButtonLink><ButtonLink href="/tournament/teams" variant="secondary">Browse teams <ArrowRight size={16} /></ButtonLink></div>
            </Card> : <Card className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5 desktop:p-6">
                <div>
                  <Kicker>YOUR TEAM</Kicker>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em]">{liveTeam?.name ?? "Void Hunters"}</h2>
                  <p className="mt-1 text-sm text-secondary-foreground">{liveTeam ? `${liveTeam.members.find((member) => member.isCaptain)?.displayName ?? "Your captain"} is captain · ${liveTeam.members.length} of 7 members` : "You are the captain · 6 of 7 members"}</p>
                </div>
                <StatusPill tone={liveTeam?.status === "submitted" ? "success" : "primary"}>{liveTeam?.status?.toUpperCase() ?? "DRAFT"}</StatusPill>
              </div>
              <div className="grid gap-px bg-border tablet:grid-cols-5">
                {starterSlots.map((role, index) => {
                  const member = teamStarters[index];
                  const player = member && "displayName" in member ? playerFromMember(member) : member;
                  if (!player) return <div className="grid min-h-28 place-items-center bg-card p-4 text-center" key={role}><Kicker>{role.toUpperCase()}</Kicker><p className="mt-2 text-xs text-muted-foreground">Empty slot</p></div>;
                  return (
                    <div className="bg-card p-4" key={role}>
                      <Kicker>{role.toUpperCase()}</Kicker>
                      <div className="mt-3 flex items-center gap-2.5">
                        <Avatar player={player} size="size-9" />
                        <div className="min-w-0">
                          <p className="m-0 truncate text-sm font-semibold">{player.name}</p>
                          <div className="mt-1"><TierBadge tier={player.tier} /></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-4 bg-secondary/55 px-5 py-4 tablet:flex-row tablet:items-center tablet:justify-between desktop:px-6">
                <div className="flex items-start gap-2.5 text-sm text-success">
                  <CheckCircle2 className="mt-0.5 shrink-0" size={17} />
                  <p className="m-0"><strong>{liveTeam?.status === "submitted" ? "Submitted." : liveTeam ? "Draft roster." : "Ready to submit."}</strong> {liveTeam ? "Open the team room to review the latest lineup." : "One role warning needs a quick look."}</p>
                </div>
                <ButtonLink href="/tournament/team" variant="secondary">Open team room <ArrowRight size={16} /></ButtonLink>
              </div>
            </Card>}
          </div>

          <aside className="flex flex-col gap-5 desktop:col-span-4">
            <Card className="p-5" id="announcements">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Kicker>ANNOUNCEMENTS</Kicker>
                  <h2 className="mt-2 font-display text-xl font-bold">From the organizer</h2>
                </div>
                <MessageSquareText className="text-primary-muted" size={20} />
              </div>
              {dashboard === undefined ? <><article className="mt-5 border-l-2 border-primary pl-4"><p className="m-0 text-sm font-semibold">Registration closes Sunday</p><p className="mt-2 text-sm leading-5 text-secondary-foreground">Submit your roster before the deadline. Match details will stay in Discord.</p><p className="mt-3 font-mono text-2xs text-muted-foreground">TODAY · 10:15</p></article><article className="mt-5 border-t border-border pt-4"><p className="m-0 text-sm font-semibold">Tier reviews are moving</p><p className="mt-2 text-sm leading-5 text-secondary-foreground">Six registrations still need review.</p></article></> : dashboard.announcements.length > 0 ? dashboard.announcements.map((announcement, index) => <article className={cn("mt-5 pl-4", index === 0 ? "border-l-2 border-primary" : "border-t border-border pt-4")} key={announcement.id}><p className="m-0 text-sm font-semibold">{announcement.title}</p><p className="mt-2 text-sm leading-5 text-secondary-foreground">{announcement.body}</p><p className="mt-3 font-mono text-2xs text-muted-foreground">{new Date(announcement.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</p></article>) : <p className="mt-5 text-sm text-muted-foreground">No announcements yet.</p>}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Kicker>NOTIFICATIONS</Kicker>
                  <h2 className="mt-2 font-display text-xl font-bold">For you</h2>
                </div>
                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{unreadCount}</span>
              </div>
              {dashboard !== undefined && unreadCount > 0 ? <form action={markAllAction} className="mt-4"><FormSubmitButton className="min-h-9 border border-border bg-secondary px-3 py-2 text-xs text-foreground hover:border-border-strong">Mark all as read</FormSubmitButton></form> : null}
              {notificationState.error ? <p aria-live="polite" className="mt-3 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">{notificationState.error}</p> : null}
              <div className="mt-5 flex flex-col gap-3">{dashboard === undefined ? <><div className="flex gap-3 rounded-xl border border-primary/25 bg-primary-soft p-3.5"><Bell className="mt-0.5 shrink-0 text-primary-muted" size={17} /><div><p className="m-0 text-sm font-semibold">Your tier was approved</p><p className="mt-1 text-xs leading-5 text-secondary-foreground">You are confirmed as T3.</p></div></div><div className="flex gap-3 rounded-xl border border-border bg-secondary p-3.5"><Users className="mt-0.5 shrink-0 text-secondary-foreground" size={17} /><div><p className="m-0 text-sm font-semibold">Rey joined Void Hunters</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Substitute slot filled.</p></div></div></> : dashboard.notifications.length > 0 ? dashboard.notifications.map((notification) => <div className={cn("flex gap-3 rounded-xl p-3.5", notification.status === "unread" ? "border border-primary/25 bg-primary-soft" : "border border-border bg-secondary")} key={notification.id}><Bell className="mt-0.5 shrink-0 text-primary-muted" size={17} /><div><p className="m-0 text-sm font-semibold">{notification.message}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{new Date(notification.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</p></div></div>) : <p className="text-sm text-muted-foreground">No notifications yet.</p>}</div>
            </Card>
          </aside>
        </div>
      </div>
    </PageFrame>
  );
}

function BrowseTeamsView({ teams }: { teams?: TournamentTeamSummary[] }) {
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [requestedTeam, setRequestedTeam] = useState<string | null>(null);
  const [requestState, requestAction] = useActionState<TournamentActionState, FormData>(
    requestToJoinTeam,
    {},
  );

  const cards = useMemo(() => {
    if (teams === undefined) {
      return teamCards.map((team, index) => ({ ...team, id: `preview-team-${index}` }));
    }

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      captain: team.captain,
      members: `${team.memberCount} / 7`,
      state: team.status === "submitted" ? "SUBMITTED" as const : "DRAFT" as const,
      eligible: team.status === "draft" && team.memberCount < 7,
      tiers: team.tierCounts,
    }));
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cards.filter((team) => {
      const matchesQuery = `${team.name} ${team.captain}`.toLowerCase().includes(normalized);
      const matchesOpen = !openOnly || team.eligible;
      return matchesQuery && matchesOpen;
    });
  }, [cards, openOnly, query]);

  return (
    <PageFrame>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            detail="Compare team size and approved tier totals before asking a captain to join."
            eyebrow="BROWSE TEAMS"
            title="Find a draft with room"
          />
          <ButtonLink href="/tournament/team"><Plus size={16} /> Create a team</ButtonLink>
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search teams</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input aria-label="Search teams" className={cn(inputClass, "pl-10")} onChange={(event) => setQuery(event.target.value)} placeholder="Search team or captain" value={query} />
            </label>
            <button className={cn(buttonBase, openOnly ? "border border-primary/35 bg-primary-soft text-primary-muted" : "border border-border bg-secondary text-secondary-foreground")} onClick={() => setOpenOnly((current) => !current)} type="button">
              <Users size={16} /> Drafts with room
            </button>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Kicker>{filteredTeams.length} TEAMS</Kicker>
          <p className="m-0 text-xs text-muted-foreground">A submitted roster cannot take requests.</p>
        </div>

        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {filteredTeams.map((team) => {
            const requestSent = requestedTeam === team.id || (teams === undefined && requestedTeam === team.name);
            return (
              <Card className="flex min-h-full flex-col overflow-hidden" key={team.id}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary-soft font-display text-lg font-bold text-primary-muted" aria-hidden="true">{team.name.slice(0, 1)}</span>
                    <StatusPill tone={team.state === "SUBMITTED" ? "success" : "primary"}>{team.state}</StatusPill>
                  </div>
                  <h2 className="mt-5 font-display text-xl font-bold">{team.name}</h2>
                  <p className="mt-1 text-sm text-secondary-foreground">Captain {team.captain}</p>

                  <div className="mt-5 grid grid-cols-2 gap-3 border-y border-border py-4">
                    <div><Kicker>MEMBERS</Kicker><p className="mt-2 font-display text-lg font-bold">{team.members}</p></div>
                    <div><Kicker>JOIN STATUS</Kicker><p className={cn("mt-2 text-sm font-semibold", team.eligible ? "text-success" : "text-muted-foreground")}>{team.eligible ? "Eligible" : "Roster locked"}</p></div>
                  </div>

                  <div className="mt-4">
                    <Kicker>APPROVED TIERS</Kicker>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Object.keys(team.tiers) as Tier[]).map((tier) => (
                        <span className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs", tierMeta[tier].border, tierMeta[tier].soft, tierMeta[tier].text)} key={tier}>
                          <strong>{team.tiers[tier]}</strong> {tier}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t border-border bg-secondary/55 p-4">
                  {team.eligible ? teams === undefined ? (
                    <button className={cn(buttonBase, "w-full", requestSent ? "border border-success/30 bg-success-soft text-success" : "bg-primary text-primary-foreground hover:bg-primary-hover")} disabled={requestSent} onClick={() => setRequestedTeam(team.name)} type="button">
                      {requestSent ? <><Check size={16} /> Request sent</> : <><Send size={16} /> Request to join</>}
                    </button>
                  ) : (
                    <form action={requestAction} onSubmit={() => setRequestedTeam(team.id)}>
                      <input name="teamId" type="hidden" value={team.id} />
                      <FormSubmitButton className={cn("w-full", requestSent ? "border border-success/30 bg-success-soft text-success" : "bg-primary text-primary-foreground hover:bg-primary-hover")}>
                        {requestSent ? <><Check size={16} /> Request sent</> : <><Send size={16} /> Request to join</>}
                      </FormSubmitButton>
                    </form>
                  ) : (
                    <div>
                      <button className={cn(buttonBase, "w-full border border-border bg-secondary text-muted-foreground")} disabled type="button"><LockKeyhole size={16} /> Requests closed</button>
                      <p className="mt-2 mb-0 text-center text-xs text-muted-foreground">The captain already submitted this roster.</p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredTeams.length === 0 ? (
          <Card className="p-8 text-center">
            <Search className="mx-auto text-muted-foreground" size={24} />
            <h2 className="mt-3 font-display text-xl font-bold">No teams match that search</h2>
            <p className="mt-2 text-sm text-secondary-foreground">Clear the search or show submitted teams.</p>
          </Card>
        ) : null}
        {teams !== undefined && requestState.error ? <p aria-live="polite" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{requestState.error}</p> : null}
      </div>
    </PageFrame>
  );
}

function RoleSlot({ role, player, submitted }: { role: Role; player?: Player; submitted: boolean }) {
  const mismatch = role === "Dragon" && player?.name === "Mori";

  if (!player) {
    return (
      <article className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-border-strong bg-secondary/45 p-4 text-center">
        <div>
          <Kicker>{role.toUpperCase()}</Kicker>
          <p className="mt-3 text-sm text-muted-foreground">Empty starter slot</p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("rounded-2xl border bg-secondary p-4", mismatch ? "border-warning/40" : "border-border")}>
      <div className="flex items-center justify-between gap-2">
        <Kicker>{role.toUpperCase()}</Kicker>
        {player.name === "Jinxed" ? <Crown className="text-primary-muted" size={15} aria-label="Captain" /> : null}
      </div>
      <div className="mt-4 flex items-center gap-3 desktop:flex-col desktop:items-start">
        <Avatar player={player} size="size-11" />
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-semibold">{player.name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{player.rank}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        {player.tierStatus === "pending" ? <StatusPill tone="warning">PENDING TIER</StatusPill> : <TierBadge tier={player.tier} />}
        <span className="text-right text-2xs text-muted-foreground">{player.primaryRole} · {player.secondaryRole}</span>
      </div>
      {mismatch ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-4 text-warning">
          <AlertTriangle className="mt-px shrink-0" size={13} /> Prefers Baron or Support
        </p>
      ) : null}
      {submitted ? <p className="mt-3 font-mono text-3xs tracking-widest text-muted-foreground">LOCKED</p> : null}
    </article>
  );
}

function CreateTeamView() {
  const [state, formAction] = useActionState<TournamentActionState, FormData>(createTeam, {});

  return (
    <PageFrame>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <SectionHeading
          detail="Start a draft roster, become its captain, and invite friends to fill the seven available places."
          eyebrow="TEAM ROOM"
          title="Create your team"
        />
        <Card className="p-5 desktop:p-6">
          <form action={formAction} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="teamName">
              Team name
              <input className={inputClass} id="teamName" name="teamName" placeholder="Night Sentinels" required />
              <span className="text-xs font-normal leading-5 text-muted-foreground">You can rename a draft team later as captain.</span>
            </label>
            {state.error ? <p aria-live="polite" className="m-0 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p> : null}
            {state.success ? (
              <div aria-live="polite" className="rounded-xl border border-success/30 bg-success-soft px-4 py-4">
                <p className="m-0 text-sm font-semibold text-success">{state.success}</p>
                <ButtonLink className="mt-4" href="/tournament/team">Open team room <ArrowRight size={16} /></ButtonLink>
              </div>
            ) : (
              <FormSubmitButton className="self-start bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover">
                <Plus size={17} /> Create team
              </FormSubmitButton>
            )}
          </form>
        </Card>
      </div>
    </PageFrame>
  );
}

function LineupEditor({ team, currentRegistrationId }: { team: TournamentTeamData; currentRegistrationId?: string }) {
  const captain = team.members.some(
    (member) => member.registrationId === currentRegistrationId && member.isCaptain,
  );
  const [assignments, setAssignments] = useState(
    team.members.map((member) => ({
      registrationId: member.registrationId,
      lineupPosition: member.lineupPosition,
      starterRole: member.starterRole,
    })),
  );
  const [state, formAction] = useActionState<TournamentActionState, FormData>(updateTeamLineup, {});

  if (!captain || team.status !== "draft") {
    return null;
  }

  return (
    <Card className="p-5 desktop:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><Kicker>CAPTAIN EDITOR</Kicker><h2 className="mt-2 font-display text-xl font-bold">Arrange the lineup</h2></div>
        <span className="text-xs text-muted-foreground">Changes save to the draft</span>
      </div>
      <form action={formAction} className="mt-5 flex flex-col gap-3">
        <input name="teamId" type="hidden" value={team.id} />
        <input name="lineup" type="hidden" value={JSON.stringify(assignments)} />
        {team.members.map((member) => {
          const assignment = assignments.find((entry) => entry.registrationId === member.registrationId);
          if (!assignment) return null;
          const player = playerFromMember(member);
          return (
            <div className="grid gap-3 rounded-xl border border-border bg-secondary p-3 tablet:grid-cols-[minmax(0,1fr)_150px_150px] tablet:items-center" key={member.registrationId}>
              <div className="flex items-center gap-3"><Avatar player={player} size="size-9" /><div className="min-w-0"><p className="m-0 truncate text-sm font-semibold">{player.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{player.tier ? `${player.tier} · ` : ""}{player.primaryRole} · {player.secondaryRole}</p></div></div>
              <label className="flex flex-col gap-1 text-2xs font-semibold text-muted-foreground">POSITION
                <select className={cn(inputClass, "min-h-10 appearance-none px-3 text-sm")} value={assignment.lineupPosition} onChange={(event) => {
                  const lineupPosition = event.target.value as "starter" | "substitute";
                  setAssignments((current) => current.map((entry) => entry.registrationId === member.registrationId ? { ...entry, lineupPosition, starterRole: lineupPosition === "starter" ? entry.starterRole ?? "Baron" : null } : entry));
                }}>
                  <option value="starter">Starter</option><option value="substitute">Substitute</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-2xs font-semibold text-muted-foreground">STARTER ROLE
                <select className={cn(inputClass, "min-h-10 appearance-none px-3 text-sm")} disabled={assignment.lineupPosition !== "starter"} value={assignment.starterRole ?? ""} onChange={(event) => setAssignments((current) => current.map((entry) => entry.registrationId === member.registrationId ? { ...entry, starterRole: event.target.value as Role } : entry))}>
                  <option value="">Choose role</option>{starterSlots.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
            </div>
          );
        })}
        {state.error ? <p aria-live="polite" className="m-0 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p> : null}
        {state.success ? <p aria-live="polite" className="m-0 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">{state.success}</p> : null}
        <FormSubmitButton className="self-start border border-border bg-secondary text-foreground hover:border-border-strong">Save lineup</FormSubmitButton>
      </form>
    </Card>
  );
}

function TeamRoomView(props: { initialSubmitted?: boolean; team?: TournamentTeamData | null; currentRegistrationId?: string; participants?: TournamentParticipantOption[] }) {
  if (props.team === null) {
    return <CreateTeamView />;
  }

  return <TeamRoomContent {...props} team={props.team ?? undefined} />;
}

function TeamRoomContent({ initialSubmitted = false, team, currentRegistrationId, participants }: { initialSubmitted?: boolean; team?: TournamentTeamData; currentRegistrationId?: string; participants?: TournamentParticipantOption[] }) {
  const preview = team === undefined;
  const [submitted, setSubmitted] = useState(initialSubmitted || team?.status === "submitted");
  const [requestState, setRequestState] = useState<"pending" | "accepted" | "declined">("pending");
  const [copied, setCopied] = useState(false);
  const [submitState, submitAction] = useActionState<TournamentActionState, FormData>(submitTeam, {});
  const [requestActionState, requestAction] = useActionState<TournamentActionState, FormData>(respondToJoinRequest, {});
  const [inviteState, inviteAction] = useActionState<TournamentActionState, FormData>(inviteParticipant, {});
  const actualTeam = team;
  const liveMembers = actualTeam?.members ?? [];
  const liveValidation = actualTeam ? validateRoster(liveMembers) : null;
  const liveStarters = actualTeam
    ? starterSlots.map((role) => {
        const member = liveMembers.find((candidate) => candidate.lineupPosition === "starter" && candidate.starterRole === role);
        return member ? playerFromMember(member) : undefined;
      })
    : rosterPlayers.slice(0, 5);
  const liveSubstitutes = actualTeam
    ? liveMembers.filter((member) => member.lineupPosition === "substitute")
    : [null, null];
  const tierEntries: Array<[Tier, number]> = liveValidation
    ? (Object.entries(liveValidation.tierCounts) as Array<[Tier, number]>)
    : [["T1", 1], ["T2", 0], ["T3", 4], ["T4", 1]];
  const teamName = actualTeam?.name ?? "Void Hunters";
  const teamStatus = actualTeam?.status ?? (submitted ? "submitted" : "draft");
  const isSubmitted = submitted || teamStatus === "submitted" || Boolean(submitState.success);
  const isCaptain = Boolean(actualTeam && currentRegistrationId && actualTeam.members.some((member) => member.registrationId === currentRegistrationId && member.isCaptain));
  const inviteOptions = participants?.filter((participant) => !actualTeam?.members.some((member) => member.registrationId === participant.id));

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText("VH-8421");
    } catch {
      // The preview can run without clipboard permission.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function submitPreviewTeam() {
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  }

  return (
    <PageFrame className={!isSubmitted ? "pb-24 desktop:pb-10" : undefined}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            detail={actualTeam ? `${actualTeam.members.find((member) => member.isCaptain)?.displayName ?? "Captain"} is captain · ${liveMembers.filter((member) => member.lineupPosition === "starter").length} starters · ${liveSubstitutes.length} substitutes` : "Jinxed is captain · 5 starters · 1 substitute"}
            eyebrow="TEAM ROOM"
            title={teamName}
          />
          <StatusPill tone={isSubmitted ? "success" : "primary"}>{isSubmitted ? "SUBMITTED" : "DRAFT"}</StatusPill>
        </div>

        {isSubmitted ? (
          <Card className="border-success/30 bg-success-soft/70 p-5 desktop:p-6" aria-live="polite">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success/12 text-success"><LockKeyhole size={21} /></span>
              <div>
                <Kicker className="text-success">ROSTER SUBMITTED</Kicker>
                <h2 className="mt-2 font-display text-xl font-bold">Participant editing is locked</h2>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-secondary-foreground">This is the roster the organizer will review. Only the organizer can unlock it for another participant edit.</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 desktop:p-5">
            <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
              <div><Kicker>CAPTAIN CONTROLS</Kicker><p className="mt-2 text-sm text-secondary-foreground">Invite friends, resolve requests, then submit the valid roster.</p></div>
              <div className="flex flex-col gap-2 phone:flex-row"><a className={cn(buttonBase, "border border-border bg-secondary text-foreground hover:border-border-strong")} href="#team-activity"><Plus size={16} /> Invite player</a><a className={cn(buttonBase, "border border-border bg-secondary text-foreground hover:border-border-strong")} href="#team-activity"><Users size={16} /> Review request</a></div>
            </div>
          </Card>
        )}

        <div className="grid items-start gap-5 desktop:grid-cols-12">
          <div className="flex flex-col gap-5 desktop:col-span-8">
            <Card className="p-5 desktop:p-6">
              <div className="flex items-center justify-between gap-3"><div><Kicker>STARTING LINEUP</Kicker><h2 className="mt-2 font-display text-xl font-bold">Five assigned roles</h2></div><span className="font-mono text-xs text-secondary-foreground">{liveStarters.filter(Boolean).length} / 5</span></div>
              <div className="mt-5 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-5">{starterSlots.map((role, index) => <RoleSlot key={role} player={liveStarters[index]} role={role} submitted={isSubmitted} />)}</div>
            </Card>

            {actualTeam ? <LineupEditor currentRegistrationId={currentRegistrationId} team={actualTeam} /> : null}

            <Card className="p-5 desktop:p-6">
              <div className="flex items-center justify-between gap-3"><div><Kicker>SUBSTITUTES</Kicker><h2 className="mt-2 font-display text-xl font-bold">Up to two substitutes</h2></div><span className="font-mono text-xs text-secondary-foreground">{liveSubstitutes.length} / 2</span></div>
              <div className="mt-5 grid gap-3 tablet:grid-cols-2">
                {liveSubstitutes.map((member, index) => member ? <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-border bg-secondary p-4" key={member.registrationId}><Avatar player={playerFromMember(member)} /><div className="min-w-0 flex-1"><p className="m-0 text-sm font-semibold">{member.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{member.primaryRole} · {member.secondaryRole}</p></div>{member.approvedTier ? <TierBadge tier={member.approvedTier} /> : <StatusPill tone="warning">PENDING</StatusPill>}</div> : <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-border-strong bg-secondary/45 p-4 text-center" key={`empty-${index}`}><p className="m-0 flex items-center gap-2 text-sm text-muted-foreground"><Plus size={16} /> Optional substitute</p></div>)}
              </div>
            </Card>

            {!isSubmitted ? (
              <Card className="p-5 desktop:p-6" id="team-activity">
                <div><Kicker>INVITES & REQUESTS</Kicker><h2 className="mt-2 font-display text-xl font-bold">Captain inbox</h2></div>
                {isCaptain && inviteOptions && inviteOptions.length > 0 ? <form action={inviteAction} className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-4 tablet:flex-row tablet:items-end"><input name="teamId" type="hidden" value={actualTeam?.id ?? ""} /><label className="flex min-w-0 flex-1 flex-col gap-2 text-xs font-semibold text-muted-foreground" htmlFor="invitedRegistrationId">INVITE A REGISTERED PLAYER<select className={cn(inputClass, "min-h-11 appearance-none text-sm")} id="invitedRegistrationId" name="invitedRegistrationId" defaultValue=""><option disabled value="">Choose a player</option>{inviteOptions.map((participant) => <option key={participant.id} value={participant.id}>{participant.displayName} · {participant.riotName}#{participant.riotTag}</option>)}</select></label><FormSubmitButton className="bg-primary text-primary-foreground hover:bg-primary-hover"><Send size={16} /> Send invite</FormSubmitButton></form> : null}
                {inviteState.error ? <p aria-live="polite" className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{inviteState.error}</p> : null}
                {actualTeam && actualTeam.joinRequests.length > 0 ? <div className="mt-5 grid gap-3 tablet:grid-cols-2">{actualTeam.joinRequests.filter((request) => request.status === "pending").map((request) => <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4" key={request.id}><div className="flex items-start justify-between gap-3"><div><Kicker className="text-primary-muted">JOIN REQUEST</Kicker><p className="mt-2 text-sm font-semibold">{request.displayName} · {request.approvedTier ?? "Pending"} · {request.primaryRole}</p></div><StatusPill tone="warning">WAITING</StatusPill></div><form action={requestAction} className="mt-4 flex gap-2"><input name="requestId" type="hidden" value={request.id} /><button className={cn(buttonBase, "flex-1 bg-primary text-primary-foreground hover:bg-primary-hover")} name="decision" type="submit" value="accepted">Accept</button><button className={cn(buttonBase, "flex-1 border border-border bg-secondary text-foreground hover:border-border-strong")} name="decision" type="submit" value="declined">Decline</button></form></div>)}</div> : preview ? <div className="mt-5 grid gap-3 tablet:grid-cols-2"><div className="rounded-2xl border border-border bg-secondary p-4"><div className="flex items-start justify-between gap-3"><div><Kicker>TEAM INVITE</Kicker><p className="mt-2 text-sm font-semibold">Kai#2288</p></div><StatusPill>WAITING</StatusPill></div><p className="mt-3 text-xs leading-5 text-muted-foreground">The invite expires when Kai joins another team.</p></div><div className="rounded-2xl border border-primary/30 bg-primary-soft p-4"><div className="flex items-start justify-between gap-3"><div><Kicker className="text-primary-muted">JOIN REQUEST</Kicker><p className="mt-2 text-sm font-semibold">Niko#8128 · T2 · Mid</p></div><StatusPill tone={requestState === "accepted" ? "success" : requestState === "declined" ? "danger" : "warning"}>{requestState.toUpperCase()}</StatusPill></div>{requestState === "pending" ? <div className="mt-4 flex gap-2"><button className={cn(buttonBase, "flex-1 bg-primary text-primary-foreground hover:bg-primary-hover")} onClick={() => setRequestState("accepted")} type="button">Accept</button><button className={cn(buttonBase, "flex-1 border border-border bg-secondary text-foreground hover:border-border-strong")} onClick={() => setRequestState("declined")} type="button">Decline</button></div> : <p className="mt-3 text-xs text-secondary-foreground">Request {requestState}.</p>}</div></div> : <p className="mt-5 text-sm text-muted-foreground">No pending invites or join requests.</p>}
                {requestActionState.error ? <p aria-live="polite" className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{requestActionState.error}</p> : null}
              </Card>
            ) : null}
          </div>

          <aside className="flex flex-col gap-5 desktop:sticky desktop:top-24 desktop:col-span-4">
            <Card className="p-5">
              <Kicker>ROSTER VALIDATION</Kicker>
              <div className={cn("mt-4 rounded-xl border p-4", liveValidation?.valid === false ? "border-danger/25 bg-danger-soft" : "border-success/25 bg-success-soft")}>
                <div className={cn("flex items-start gap-2.5", liveValidation?.valid === false ? "text-danger" : "text-success")}><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><div><p className="m-0 text-sm font-semibold">{liveValidation?.valid === false ? "Blocking issues" : "No blocking issues"}</p><p className="mt-1 text-xs leading-5 text-secondary-foreground">{liveValidation?.valid === false ? liveValidation.blockingIssues[0] : "Five starters, approved tiers, and tier caps all pass."}</p></div></div>
              </div>
              {(liveValidation?.warnings.length ?? 1) > 0 ? <div className="mt-3 rounded-xl border border-warning/25 bg-warning-soft p-4"><div className="flex items-start gap-2.5 text-warning"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><p className="m-0 text-sm font-semibold">Role warnings</p><p className="mt-1 text-xs leading-5 text-secondary-foreground">{liveValidation?.warnings[0] ?? "Mori prefers Baron or Support, not Dragon. This does not block submission."}</p></div></div></div> : null}
              <div className="mt-5 border-t border-border pt-4"><Kicker>FULL ROSTER TIERS</Kicker><div className="mt-3 flex flex-wrap gap-2">{tierEntries.filter(([, count]) => count > 0).map(([tier, count]) => <span className={cn("text-sm", tierMeta[tier].text)} key={tier}>{count} × {tier}</span>)}</div></div>
              {!isSubmitted ? <div className="mt-5 border-t border-border pt-5">{preview ? <><button className={cn(buttonBase, "hidden w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover desktop:inline-flex")} onClick={submitPreviewTeam} type="button"><ShieldCheck size={17} /> Submit team</button><p className="mt-3 mb-0 hidden text-center text-xs leading-5 text-muted-foreground desktop:block">Submission locks participant editing.</p></> : <form action={submitAction} onSubmit={() => window.scrollTo({ top: 0 })}><input name="teamId" type="hidden" value={actualTeam?.id ?? ""} /><FormSubmitButton className="hidden w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover desktop:inline-flex"><ShieldCheck size={17} /> Submit team</FormSubmitButton><p className="mt-3 mb-0 hidden text-center text-xs leading-5 text-muted-foreground desktop:block">Submission locks participant editing.</p></form>}</div> : null}
              {submitState.error ? <div className="mt-4 rounded-xl border border-danger/30 bg-danger-soft p-4" aria-live="polite"><p className="m-0 text-sm font-semibold text-danger">{submitState.error}</p>{submitState.blockingIssues?.map((issue) => <p className="mt-2 text-xs leading-5 text-secondary-foreground" key={issue}>{issue}</p>)}</div> : null}
            </Card>

            <Card className="p-5"><Kicker>TEAM INVITE CODE</Kicker><div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary p-2"><code className="min-w-0 flex-1 px-2 font-mono text-sm font-bold tracking-[0.12em] text-primary-muted">VH-8421</code><button className={cn(buttonBase, "px-3 py-2 text-xs", copied ? "bg-success-soft text-success" : "bg-primary text-primary-foreground hover:bg-primary-hover")} onClick={copyInvite} type="button">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></div><p className="mt-3 text-xs leading-5 text-muted-foreground">This team code is separate from the private tournament invite.</p></Card>
          </aside>
        </div>
        {!isSubmitted ? <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-xl desktop:hidden">{preview ? <button className={cn(buttonBase, "mx-auto flex w-full max-w-md bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-hover")} onClick={submitPreviewTeam} type="button"><ShieldCheck size={17} /> Submit team</button> : <form action={submitAction} onSubmit={() => window.scrollTo({ top: 0 })}><input name="teamId" type="hidden" value={actualTeam?.id ?? ""} /><FormSubmitButton className="mx-auto flex w-full max-w-md bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-hover"><ShieldCheck size={17} /> Submit team</FormSubmitButton></form>}</div> : null}
      </div>
    </PageFrame>
  );
}

function MetricCard({ label, value, note, tone = "text-foreground" }: { label: string; value: string; note: string; tone?: string }) {
  return (
    <Card className="p-4 desktop:p-5">
      <Kicker>{label}</Kicker>
      <p className={cn("mt-3 font-display text-3xl font-bold tracking-[-0.04em]", tone)}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
    </Card>
  );
}

function OrganizerOverview({ deadline, tournamentName, overview }: { deadline: string; tournamentName: string; overview?: OrganizerOverviewData }) {
  const preview = overview === undefined;
  const previewOverview: OrganizerOverviewData = {
    joinedCount: 42,
    registeredCount: 38,
    pendingTierCount: 6,
    teamCount: 10,
    draftTeamCount: 7,
    submittedTeamCount: 3,
    blockedTeamCount: 2,
    pendingReviews: [
      { id: "preview-rey", displayName: "Rey", riotName: "Rey", riotTag: "9301", currentRank: "Diamond II", selfAssessedTier: "T3", primaryRole: "Jungle", secondaryRole: "Baron" },
      { id: "preview-niko", displayName: "Niko", riotName: "Niko", riotTag: "8128", currentRank: "Master", selfAssessedTier: "T2", primaryRole: "Mid", secondaryRole: "Dragon" },
      { id: "preview-kai", displayName: "Kai", riotName: "Kai", riotTag: "2288", currentRank: "Emerald I", selfAssessedTier: "T4", primaryRole: "Support", secondaryRole: "Jungle" },
    ],
  };
  const currentOverview = overview ?? previewOverview;
  return (
    <PageFrame>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            detail="Review the work that can block registration or team submission."
            eyebrow="ORGANIZER OVERVIEW"
            title={`${tournamentName} at a glance`}
          />
          <ButtonLink href="#settings-form" variant="secondary"><Settings size={16} /> Tournament settings</ButtonLink>
        </div>

        <DeadlineBanner deadline={deadline} />

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border p-5 desktop:p-6">
            <div><Kicker className="text-warning">TIER REVIEW QUEUE</Kicker><h2 className="mt-2 font-display text-2xl font-bold">{currentOverview.pendingTierCount} {currentOverview.pendingTierCount === 1 ? "player needs" : "players need"} a decision</h2><p className="mt-2 text-sm text-secondary-foreground">Review one registration at a time.</p></div>
            <ButtonLink href="/admin/tier-review">Start review <ArrowRight size={16} /></ButtonLink>
          </div>
          <div className="divide-y divide-border">
            {currentOverview.pendingReviews.slice(0, 3).map((player) => {
              const name = `${player.riotName}#${player.riotTag}`;
              const roles = `${player.primaryRole} · ${player.secondaryRole}`;
              return (
              <div className="grid gap-3 px-5 py-4 tablet:grid-cols-[minmax(0,1fr)_130px_90px_160px_auto] tablet:items-center desktop:px-6" key={player.id}>
                <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground">{player.displayName.slice(0, 1)}</span><div><p className="m-0 text-sm font-semibold">{name}</p><p className="mt-1 text-xs text-muted-foreground tablet:hidden">{player.currentRank} · {roles}</p></div></div>
                <p className="m-0 hidden text-sm text-secondary-foreground tablet:block">{player.currentRank}</p>
                <div><TierBadge tier={player.selfAssessedTier} /></div>
                <p className="m-0 hidden text-sm text-secondary-foreground tablet:block">{roles}</p>
                <ButtonLink className="justify-self-start tablet:justify-self-end" href={preview ? "/admin/tier-review" : `/admin/tier-review?registration=${player.id}`} variant="quiet">Review <ArrowRight size={15} /></ButtonLink>
              </div>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-5">
          <MetricCard label="JOINED" note="Entered with the invite" value={String(currentOverview.joinedCount)} />
          <MetricCard label="REGISTERED" note="Completed player details" value={String(currentOverview.registeredCount)} />
          <MetricCard label="PENDING TIERS" note="Need organizer review" tone="text-warning" value={String(currentOverview.pendingTierCount)} />
          <MetricCard label="TEAMS" note={`${currentOverview.draftTeamCount} draft · ${currentOverview.submittedTeamCount} submitted`} tone="text-primary-muted" value={String(currentOverview.teamCount)} />
          <MetricCard label="BLOCKED TEAMS" note="Cannot be submitted yet" tone="text-danger" value={String(currentOverview.blockedTeamCount)} />
        </div>

        <div className="grid gap-5 desktop:grid-cols-2">
          <Card className="p-5 desktop:p-6" id="teams">
            <div className="flex items-start justify-between gap-3"><div><Kicker>TEAM OVERSIGHT</Kicker><h2 className="mt-2 font-display text-xl font-bold">Two drafts are blocked</h2></div><Swords className="text-danger" size={21} /></div>
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4"><div><p className="m-0 text-sm font-semibold">Drake Raiders</p><p className="mt-1 text-xs text-secondary-foreground">Two T1 players. Maximum is one.</p></div><StatusPill tone="danger">BLOCKED</StatusPill></div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4"><div><p className="m-0 text-sm font-semibold">Dawn Guard</p><p className="mt-1 text-xs text-secondary-foreground">One member still needs tier approval.</p></div><StatusPill tone="warning">WAITING</StatusPill></div>
            </div>
          </Card>

          <Card className="p-5 desktop:p-6" id="announcements">
            <div className="flex items-start justify-between gap-3"><div><Kicker>ANNOUNCEMENTS</Kicker><h2 className="mt-2 font-display text-xl font-bold">Latest post</h2></div><MessageSquareText className="text-primary-muted" size={21} /></div>
            <div className="mt-5 rounded-xl border border-border bg-secondary p-4"><p className="m-0 text-sm font-semibold">Registration closes Sunday</p><p className="mt-2 text-sm leading-5 text-secondary-foreground">Submit your roster before the deadline. Match details will stay in Discord.</p><p className="mt-3 font-mono text-2xs text-muted-foreground">POSTED TODAY · 10:15</p></div>
            <ButtonLink className="mt-4 w-full" href="/admin#announcement-form" variant="secondary"><Plus size={16} /> New announcement</ButtonLink>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}

function OrganizerTierReview({ review }: { review?: TierReviewData | null }) {
  if (review === null) {
    return (
      <PageFrame>
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <CheckCircle2 className="mx-auto text-success" size={28} />
          <h1 className="mt-4 font-display text-2xl font-bold">Tier review is clear</h1>
          <p className="mt-2 text-sm leading-5 text-secondary-foreground">There are no pending player registrations to review.</p>
          <ButtonLink className="mt-6" href="/admin">Back to overview <ArrowRight size={16} /></ButtonLink>
        </Card>
      </PageFrame>
    );
  }

  return <OrganizerTierReviewContent review={review} />;
}

function OrganizerTierReviewContent({ review }: { review?: TierReviewData }) {
  const previewReview: TierReviewData = {
    id: "preview-review",
    displayName: "Rey",
    riotName: "Rey",
    riotTag: "9301",
    currentRank: "Diamond II",
    selfAssessedTier: "T3",
    approvedTier: null,
    tierStatus: "pending",
    primaryRole: "Jungle",
    secondaryRole: "Baron",
    joinedAt: "2026-08-29T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
    pendingCount: 6,
  };
  const currentReview = review ?? previewReview;
  const [approvedTier, setApprovedTier] = useState<Tier>(currentReview.approvedTier ?? currentReview.selfAssessedTier);
  const [previewSaved, setPreviewSaved] = useState(false);
  const [state, formAction] = useActionState<TournamentActionState, FormData>(approveRegistrationTier, {});
  const saved = Boolean(state.success) || previewSaved;

  return (
    <PageFrame>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:text-foreground" href="/admin"><ArrowLeft size={16} /> Overview</Link>
            <SectionHeading detail="Approve the self-assessed tier or choose the correct one. This decision feeds roster validation." eyebrow="TIER REVIEW" title={`Review ${currentReview.riotName}#${currentReview.riotTag}`} />
          </div>
          <StatusPill tone={saved ? "success" : "warning"}>{saved ? "APPROVED" : "PENDING"}</StatusPill>
        </div>

        {saved ? (
          <Card className="border-success/30 bg-success-soft p-5" aria-live="polite">
            <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-success" size={21} /><div><p className="m-0 text-sm font-semibold text-success">{currentReview.riotName} is approved as {approvedTier}</p><p className="mt-1 text-sm text-secondary-foreground">Any team containing {currentReview.riotName} will be revalidated.</p></div></div>
          </Card>
        ) : null}

        <div className="grid items-start gap-5 desktop:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="p-5 desktop:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
              <div className="flex items-center gap-4"><Avatar player={rosterPlayers[5]} size="size-13" /><div><h2 className="m-0 font-display text-xl font-bold">{currentReview.riotName}#{currentReview.riotTag}</h2><p className="mt-1 text-sm text-secondary-foreground">Joined {new Date(currentReview.joinedAt).toLocaleDateString("en", { month: "short", day: "numeric" })} · registration updated {new Date(currentReview.updatedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</p></div></div>
              <StatusPill tone="warning">SELF-ASSESSED {currentReview.selfAssessedTier}</StatusPill>
            </div>

            <div className="mt-5 grid gap-3 tablet:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary p-4"><Kicker>CURRENT RANK</Kicker><p className="mt-2 text-sm font-semibold">{currentReview.currentRank}</p></div>
              <div className="rounded-xl border border-border bg-secondary p-4"><Kicker>PRIMARY ROLE</Kicker><p className="mt-2 text-sm font-semibold">{currentReview.primaryRole}</p></div>
              <div className="rounded-xl border border-border bg-secondary p-4"><Kicker>SECONDARY ROLE</Kicker><p className="mt-2 text-sm font-semibold">{currentReview.secondaryRole}</p></div>
            </div>

            <fieldset className="mt-7 border-t border-border pt-6">
              <legend className="font-display text-xl font-bold">Approved tier</legend>
              <p className="mt-2 text-sm text-secondary-foreground">Diamond maps to T3 by default.</p>
              <div className="mt-4 grid gap-3 tablet:grid-cols-2">
                {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                  <label className={cn("flex min-h-18 cursor-pointer items-center gap-3 rounded-xl border p-4", approvedTier === tier ? "border-primary bg-primary-soft" : "border-border bg-secondary hover:border-border-strong")} key={tier}>
                    <input checked={approvedTier === tier} className="sr-only" name="approvedTier" onChange={() => { setApprovedTier(tier); setPreviewSaved(false); }} type="radio" value={tier} />
                    <TierBadge tier={tier} />
                    <span className="text-sm text-secondary-foreground">{tierMeta[tier].range}</span>
                    <span className={cn("ml-auto grid size-5 place-items-center rounded-full border", approvedTier === tier ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{approvedTier === tier ? <Check size={12} /> : null}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <form action={formAction} className="mt-7 flex flex-col gap-3 border-t border-border pt-6 tablet:flex-row tablet:items-center tablet:justify-between">
              <input name="registrationId" type="hidden" value={currentReview.id} />
              <input name="approvedTier" type="hidden" value={approvedTier} />
              <p className="m-0 max-w-md text-xs leading-5 text-muted-foreground">Changing an approved tier revalidates every affected team. An invalid submitted team returns to draft.</p>
              {review === undefined ? <button className={cn(buttonBase, "shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover")} onClick={(event) => { event.preventDefault(); setPreviewSaved(true); }} type="submit"><UserRoundCheck size={17} /> Approve {approvedTier}</button> : <FormSubmitButton className="shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover"><UserRoundCheck size={17} /> Approve {approvedTier}</FormSubmitButton>}
              {state.error ? <p aria-live="polite" className="basis-full rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p> : null}
            </form>
          </Card>

          <aside className="flex flex-col gap-5 desktop:sticky desktop:top-24">
            <Card className="overflow-hidden">
              <div className="border-b border-border p-5"><Kicker>DEFAULT TIER MAP</Kicker><h2 className="mt-2 font-display text-xl font-bold">Rank reference</h2></div>
              <div className="divide-y divide-border">{(Object.keys(tierMeta) as Tier[]).map((tier) => <div className={cn("flex items-center gap-3 p-4", approvedTier === tier && "bg-primary-soft")} key={tier}><TierBadge tier={tier} /><p className="m-0 text-sm text-secondary-foreground">{tierMeta[tier].range}</p></div>)}</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3"><Kicker>QUEUE</Kicker><span className="font-display text-xl font-bold text-warning">{Math.max(currentReview.pendingCount - (saved ? 1 : 0), 0)}</span></div>
              <p className="mt-3 text-sm leading-5 text-secondary-foreground">{currentReview.riotName} is first. Approve one player, then move to the next registration.</p>
              <button className={cn(buttonBase, "mt-4 w-full border border-border bg-secondary text-muted-foreground")} disabled={!saved} type="button">Review next player <ArrowRight size={16} /></button>
            </Card>
          </aside>
        </div>
      </div>
    </PageFrame>
  );
}

export function TournamentApp({
  view,
  tournamentName = defaultSettings.tournamentName,
  region = defaultSettings.region,
  deadline = defaultSettings.deadline,
  userName = "Jinxed",
  showSignOut = true,
  registration,
  teams,
  team,
  tierReview,
  currentRegistrationId,
  dashboard,
  overview,
  participants,
}: TournamentAppProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppHeader region={region} showSignOut={showSignOut} userName={userName} view={view} />
      {view === "registration" ? <RegistrationView deadline={deadline} region={region} registration={registration} tournamentName={tournamentName} /> : null}
      {view === "dashboard" ? <DashboardView dashboard={dashboard} deadline={deadline} region={region} registration={registration} team={team} tournamentName={tournamentName} userName={userName} /> : null}
      {view === "teams" ? <BrowseTeamsView teams={teams} /> : null}
      {view === "builder" ? <TeamRoomView currentRegistrationId={currentRegistrationId} participants={participants} team={team} /> : null}
      {view === "submitted" ? <TeamRoomView currentRegistrationId={currentRegistrationId} initialSubmitted participants={participants} team={team} /> : null}
      {view === "admin" ? <OrganizerOverview deadline={deadline} overview={overview} tournamentName={tournamentName} /> : null}
      {view === "tier-review" ? <OrganizerTierReview review={tierReview} /> : null}
    </div>
  );
}
