"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
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

import { cn } from "@/lib/utils";

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
};

type Player = {
  name: string;
  riotId: string;
  rank: string;
  tier: Tier;
  primaryRole: Role;
  secondaryRole: Role;
  initial: string;
  avatarClass: string;
};

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
}: {
  tournamentName: string;
  region: string;
  deadline: string;
}) {
  const [selectedTier, setSelectedTier] = useState<Tier>("T3");
  const [primaryRole, setPrimaryRole] = useState<Role>("Mid");
  const [secondaryRole, setSecondaryRole] = useState<Role>("Support");
  const [submitted, setSubmitted] = useState(false);

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
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
              The organizer will review your T3 self-assessment. You can start looking at teams now.
            </p>
            <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-secondary p-4 text-left tablet:grid-cols-3">
              <div><Kicker>RIOT ID</Kicker><p className="mt-2 text-sm font-semibold">Jinxed#0420</p></div>
              <div><Kicker>RANK</Kicker><p className="mt-2 text-sm font-semibold">Diamond IV</p></div>
              <div><Kicker>ROLES</Kicker><p className="mt-2 text-sm font-semibold">{primaryRole} · {secondaryRole}</p></div>
            </div>
            <div className="mt-6 flex flex-col justify-center gap-3 tablet:flex-row">
              <ButtonLink href="/tournament">Go to participant home <ArrowRight size={16} /></ButtonLink>
              <button className={cn(buttonBase, "border border-border bg-secondary text-foreground hover:border-border-strong")} onClick={() => setSubmitted(false)} type="button">
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

        <form className="grid items-start gap-5 desktop:grid-cols-[minmax(0,1fr)_360px]" onSubmit={submitRegistration}>
          <Card className="p-5 desktop:p-6">
            <div className="grid gap-5 tablet:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="riotName">
                Riot name
                <input className={inputClass} defaultValue="Jinxed" id="riotName" name="riotName" placeholder="Your Riot name" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="riotTag">
                Riot tag
                <input className={inputClass} defaultValue="0420" id="riotTag" name="riotTag" placeholder="EUW" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold tablet:col-span-2" htmlFor="currentRank">
                Current rank
                <span className="text-xs font-normal text-muted-foreground">Choose the rank shown in Wild Rift today.</span>
                <div className="relative">
                  <select className={cn(inputClass, "appearance-none pr-10")} defaultValue="Diamond IV" id="currentRank" name="currentRank">
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
              <button className={cn(buttonBase, "shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover")} type="submit">
                Send for review <ArrowRight size={16} />
              </button>
            </div>
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
}: {
  tournamentName: string;
  region: string;
  deadline: string;
  userName: string;
}) {
  const user = { ...rosterPlayers[2], name: userName, riotId: `${userName}#0420`, initial: userName.slice(0, 1).toUpperCase() };

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
                    <p className="mt-1 text-sm text-secondary-foreground">{user.rank} · Mid primary · Support secondary</p>
                  </div>
                </div>
                <StatusPill tone="success">APPROVED</StatusPill>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <TierBadge tier="T3" />
                <p className="m-0 text-sm text-secondary-foreground">The organizer approved your T3 tier on Aug 30.</p>
                <ButtonLink className="ml-auto" href="/tournament/register" variant="quiet">Edit registration</ButtonLink>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-5 desktop:p-6">
                <div>
                  <Kicker>YOUR TEAM</Kicker>
                  <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em]">Void Hunters</h2>
                  <p className="mt-1 text-sm text-secondary-foreground">You are the captain · 6 of 7 members</p>
                </div>
                <StatusPill tone="primary">DRAFT</StatusPill>
              </div>
              <div className="grid gap-px bg-border tablet:grid-cols-5">
                {starterSlots.map((role, index) => {
                  const player = rosterPlayers[index];
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
                  <p className="m-0"><strong>Ready to submit.</strong> One role warning needs a quick look.</p>
                </div>
                <ButtonLink href="/tournament/team" variant="secondary">Open team room <ArrowRight size={16} /></ButtonLink>
              </div>
            </Card>
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
              <article className="mt-5 border-l-2 border-primary pl-4">
                <p className="m-0 text-sm font-semibold">Registration closes Sunday</p>
                <p className="mt-2 text-sm leading-5 text-secondary-foreground">Submit your roster before the deadline. Match details will stay in Discord.</p>
                <p className="mt-3 font-mono text-2xs text-muted-foreground">TODAY · 10:15</p>
              </article>
              <article className="mt-5 border-t border-border pt-4">
                <p className="m-0 text-sm font-semibold">Tier reviews are moving</p>
                <p className="mt-2 text-sm leading-5 text-secondary-foreground">Six registrations still need review.</p>
              </article>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Kicker>NOTIFICATIONS</Kicker>
                  <h2 className="mt-2 font-display text-xl font-bold">For you</h2>
                </div>
                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <div className="flex gap-3 rounded-xl border border-primary/25 bg-primary-soft p-3.5">
                  <Bell className="mt-0.5 shrink-0 text-primary-muted" size={17} />
                  <div><p className="m-0 text-sm font-semibold">Your tier was approved</p><p className="mt-1 text-xs leading-5 text-secondary-foreground">You are confirmed as T3.</p></div>
                </div>
                <div className="flex gap-3 rounded-xl border border-border bg-secondary p-3.5">
                  <Users className="mt-0.5 shrink-0 text-secondary-foreground" size={17} />
                  <div><p className="m-0 text-sm font-semibold">Rey joined Void Hunters</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Substitute slot filled.</p></div>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </PageFrame>
  );
}

function BrowseTeamsView() {
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [requestedTeam, setRequestedTeam] = useState<string | null>(null);

  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return teamCards.filter((team) => {
      const matchesQuery = `${team.name} ${team.captain}`.toLowerCase().includes(normalized);
      const matchesOpen = !openOnly || team.eligible;
      return matchesQuery && matchesOpen;
    });
  }, [openOnly, query]);

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
            const requestSent = requestedTeam === team.name;
            return (
              <Card className="flex min-h-full flex-col overflow-hidden" key={team.name}>
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
                  {team.eligible ? (
                    <button className={cn(buttonBase, "w-full", requestSent ? "border border-success/30 bg-success-soft text-success" : "bg-primary text-primary-foreground hover:bg-primary-hover")} disabled={requestSent} onClick={() => setRequestedTeam(team.name)} type="button">
                      {requestSent ? <><Check size={16} /> Request sent</> : <><Send size={16} /> Request to join</>}
                    </button>
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
      </div>
    </PageFrame>
  );
}

function RoleSlot({ role, player, submitted }: { role: Role; player: Player; submitted: boolean }) {
  const mismatch = role === "Dragon" && player.name === "Mori";

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
        <TierBadge tier={player.tier} />
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

function TeamRoomView({ initialSubmitted = false }: { initialSubmitted?: boolean }) {
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [requestState, setRequestState] = useState<"pending" | "accepted" | "declined">("pending");
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText("VH-8421");
    } catch {
      // The preview can run without clipboard permission.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function submitTeam() {
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  }

  return (
    <PageFrame className={!submitted ? "pb-24 desktop:pb-10" : undefined}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            detail="Jinxed is captain · 5 starters · 1 substitute"
            eyebrow="TEAM ROOM"
            title="Void Hunters"
          />
          <StatusPill tone={submitted ? "success" : "primary"}>{submitted ? "SUBMITTED" : "DRAFT"}</StatusPill>
        </div>

        {submitted ? (
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
              <div>
                <Kicker>CAPTAIN CONTROLS</Kicker>
                <p className="mt-2 text-sm text-secondary-foreground">Invite friends, resolve requests, then submit the valid roster.</p>
              </div>
              <div className="flex flex-col gap-2 phone:flex-row">
                <a className={cn(buttonBase, "border border-border bg-secondary text-foreground hover:border-border-strong")} href="#team-activity"><Plus size={16} /> Invite player</a>
                <a className={cn(buttonBase, "border border-border bg-secondary text-foreground hover:border-border-strong")} href="#team-activity"><Users size={16} /> Review request</a>
              </div>
            </div>
          </Card>
        )}

        <div className="grid items-start gap-5 desktop:grid-cols-12">
          <div className="flex flex-col gap-5 desktop:col-span-8">
            <Card className="p-5 desktop:p-6">
              <div className="flex items-center justify-between gap-3">
                <div><Kicker>STARTING LINEUP</Kicker><h2 className="mt-2 font-display text-xl font-bold">Five assigned roles</h2></div>
                <span className="font-mono text-xs text-secondary-foreground">5 / 5</span>
              </div>
              <div className="mt-5 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-5">
                {starterSlots.map((role, index) => <RoleSlot key={role} player={rosterPlayers[index]} role={role} submitted={submitted} />)}
              </div>
            </Card>

            <Card className="p-5 desktop:p-6">
              <div className="flex items-center justify-between gap-3">
                <div><Kicker>SUBSTITUTES</Kicker><h2 className="mt-2 font-display text-xl font-bold">One of two slots filled</h2></div>
                <span className="font-mono text-xs text-secondary-foreground">1 / 2</span>
              </div>
              <div className="mt-5 grid gap-3 tablet:grid-cols-2">
                <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-border bg-secondary p-4">
                  <Avatar player={rosterPlayers[5]} />
                  <div className="min-w-0 flex-1"><p className="m-0 text-sm font-semibold">Rey</p><p className="mt-1 text-xs text-muted-foreground">Jungle · Baron</p></div>
                  <TierBadge tier="T3" />
                </div>
                <div className="grid min-h-24 place-items-center rounded-2xl border border-dashed border-border-strong bg-secondary/45 p-4 text-center">
                  <p className="m-0 flex items-center gap-2 text-sm text-muted-foreground"><Plus size={16} /> Optional substitute</p>
                </div>
              </div>
            </Card>

            {!submitted ? (
              <Card className="p-5 desktop:p-6" id="team-activity">
                <div><Kicker>INVITES & REQUESTS</Kicker><h2 className="mt-2 font-display text-xl font-bold">Captain inbox</h2></div>
                <div className="mt-5 grid gap-3 tablet:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-secondary p-4">
                    <div className="flex items-start justify-between gap-3"><div><Kicker>TEAM INVITE</Kicker><p className="mt-2 text-sm font-semibold">Kai#2288</p></div><StatusPill>WAITING</StatusPill></div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">The invite expires when Kai joins another team.</p>
                  </div>
                  <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4">
                    <div className="flex items-start justify-between gap-3"><div><Kicker className="text-primary-muted">JOIN REQUEST</Kicker><p className="mt-2 text-sm font-semibold">Niko#8128 · T2 · Mid</p></div><StatusPill tone={requestState === "accepted" ? "success" : requestState === "declined" ? "danger" : "warning"}>{requestState.toUpperCase()}</StatusPill></div>
                    {requestState === "pending" ? (
                      <div className="mt-4 flex gap-2">
                        <button className={cn(buttonBase, "flex-1 bg-primary text-primary-foreground hover:bg-primary-hover")} onClick={() => setRequestState("accepted")} type="button">Accept</button>
                        <button className={cn(buttonBase, "flex-1 border border-border bg-secondary text-foreground hover:border-border-strong")} onClick={() => setRequestState("declined")} type="button">Decline</button>
                      </div>
                    ) : <p className="mt-3 text-xs text-secondary-foreground">Request {requestState}.</p>}
                  </div>
                </div>
              </Card>
            ) : null}
          </div>

          <aside className="flex flex-col gap-5 desktop:sticky desktop:top-24 desktop:col-span-4">
            <Card className="p-5">
              <Kicker>ROSTER VALIDATION</Kicker>
              <div className="mt-4 rounded-xl border border-success/25 bg-success-soft p-4">
                <div className="flex items-start gap-2.5 text-success"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><div><p className="m-0 text-sm font-semibold">No blocking issues</p><p className="mt-1 text-xs leading-5 text-secondary-foreground">Five starters, approved tiers, and tier caps all pass.</p></div></div>
              </div>
              <div className="mt-3 rounded-xl border border-warning/25 bg-warning-soft p-4">
                <div className="flex items-start gap-2.5 text-warning"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><p className="m-0 text-sm font-semibold">One role warning</p><p className="mt-1 text-xs leading-5 text-secondary-foreground">Mori prefers Baron or Support, not Dragon. This does not block submission.</p></div></div>
              </div>
              <div className="mt-5 border-t border-border pt-4">
                <Kicker>FULL ROSTER TIERS</Kicker>
                <div className="mt-3 flex flex-wrap gap-2"><span className="text-sm text-tier-t1">1 × T1</span><span className="text-sm text-tier-t3">4 × T3</span><span className="text-sm text-tier-t4">1 × T4</span></div>
              </div>
              {!submitted ? (
                <div className="mt-5 border-t border-border pt-5">
                  <button className={cn(buttonBase, "hidden w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover desktop:inline-flex")} onClick={submitTeam} type="button"><ShieldCheck size={17} /> Submit team</button>
                  <p className="mt-3 mb-0 hidden text-center text-xs leading-5 text-muted-foreground desktop:block">Submission locks participant editing.</p>
                </div>
              ) : null}
            </Card>

            <Card className="p-5">
              <Kicker>TEAM INVITE CODE</Kicker>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary p-2">
                <code className="min-w-0 flex-1 px-2 font-mono text-sm font-bold tracking-[0.12em] text-primary-muted">VH-8421</code>
                <button className={cn(buttonBase, "px-3 py-2 text-xs", copied ? "bg-success-soft text-success" : "bg-primary text-primary-foreground hover:bg-primary-hover")} onClick={copyInvite} type="button">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">This team code is separate from the private tournament invite.</p>
            </Card>
          </aside>
        </div>
        {!submitted ? (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-xl desktop:hidden">
            <button className={cn(buttonBase, "mx-auto flex w-full max-w-md bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-hover")} onClick={submitTeam} type="button"><ShieldCheck size={17} /> Submit team</button>
          </div>
        ) : null}
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

function OrganizerOverview({ deadline, tournamentName }: { deadline: string; tournamentName: string }) {
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
            <div><Kicker className="text-warning">TIER REVIEW QUEUE</Kicker><h2 className="mt-2 font-display text-2xl font-bold">Six players need a decision</h2><p className="mt-2 text-sm text-secondary-foreground">Review one registration at a time.</p></div>
            <ButtonLink href="/admin/tier-review">Start review <ArrowRight size={16} /></ButtonLink>
          </div>
          <div className="divide-y divide-border">
            {[
              ["Rey#9301", "Diamond II", "T3", "Jungle · Baron"],
              ["Niko#8128", "Master", "T2", "Mid · Dragon"],
              ["Kai#2288", "Emerald I", "T4", "Support · Jungle"],
            ].map(([name, rank, tier, roles], index) => (
              <div className="grid gap-3 px-5 py-4 tablet:grid-cols-[minmax(0,1fr)_130px_90px_160px_auto] tablet:items-center desktop:px-6" key={name}>
                <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground">{name.slice(0, 1)}</span><div><p className="m-0 text-sm font-semibold">{name}</p><p className="mt-1 text-xs text-muted-foreground tablet:hidden">{rank} · {roles}</p></div></div>
                <p className="m-0 hidden text-sm text-secondary-foreground tablet:block">{rank}</p>
                <div><TierBadge tier={tier as Tier} /></div>
                <p className="m-0 hidden text-sm text-secondary-foreground tablet:block">{roles}</p>
                <ButtonLink className="justify-self-start tablet:justify-self-end" href={`/admin/tier-review?player=${index + 1}`} variant="quiet">Review <ArrowRight size={15} /></ButtonLink>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-5">
          <MetricCard label="JOINED" note="Entered with the invite" value="42" />
          <MetricCard label="REGISTERED" note="Completed player details" value="38" />
          <MetricCard label="PENDING TIERS" note="Need organizer review" tone="text-warning" value="6" />
          <MetricCard label="TEAMS" note="7 draft · 3 submitted" tone="text-primary-muted" value="10" />
          <MetricCard label="BLOCKED TEAMS" note="Cannot be submitted yet" tone="text-danger" value="2" />
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
            <button className={cn(buttonBase, "mt-4 w-full border border-border bg-secondary text-foreground hover:border-border-strong")} type="button"><Plus size={16} /> New announcement</button>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}

function OrganizerTierReview() {
  const [approvedTier, setApprovedTier] = useState<Tier>("T3");
  const [saved, setSaved] = useState(false);

  return (
    <PageFrame>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:text-foreground" href="/admin"><ArrowLeft size={16} /> Overview</Link>
            <SectionHeading detail="Approve the self-assessed tier or choose the correct one. This decision feeds roster validation." eyebrow="TIER REVIEW" title="Review Rey#9301" />
          </div>
          <StatusPill tone={saved ? "success" : "warning"}>{saved ? "APPROVED" : "PENDING"}</StatusPill>
        </div>

        {saved ? (
          <Card className="border-success/30 bg-success-soft p-5" aria-live="polite">
            <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-success" size={21} /><div><p className="m-0 text-sm font-semibold text-success">Rey is approved as {approvedTier}</p><p className="mt-1 text-sm text-secondary-foreground">Any team containing Rey will be revalidated.</p></div></div>
          </Card>
        ) : null}

        <div className="grid items-start gap-5 desktop:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="p-5 desktop:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
              <div className="flex items-center gap-4"><Avatar player={rosterPlayers[5]} size="size-13" /><div><h2 className="m-0 font-display text-xl font-bold">Rey#9301</h2><p className="mt-1 text-sm text-secondary-foreground">Joined Aug 29 · registration updated Aug 30</p></div></div>
              <StatusPill tone="warning">SELF-ASSESSED T3</StatusPill>
            </div>

            <div className="mt-5 grid gap-3 tablet:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary p-4"><Kicker>CURRENT RANK</Kicker><p className="mt-2 text-sm font-semibold">Diamond II</p></div>
              <div className="rounded-xl border border-border bg-secondary p-4"><Kicker>PRIMARY ROLE</Kicker><p className="mt-2 text-sm font-semibold">Jungle</p></div>
              <div className="rounded-xl border border-border bg-secondary p-4"><Kicker>SECONDARY ROLE</Kicker><p className="mt-2 text-sm font-semibold">Baron</p></div>
            </div>

            <fieldset className="mt-7 border-t border-border pt-6">
              <legend className="font-display text-xl font-bold">Approved tier</legend>
              <p className="mt-2 text-sm text-secondary-foreground">Diamond maps to T3 by default.</p>
              <div className="mt-4 grid gap-3 tablet:grid-cols-2">
                {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                  <label className={cn("flex min-h-18 cursor-pointer items-center gap-3 rounded-xl border p-4", approvedTier === tier ? "border-primary bg-primary-soft" : "border-border bg-secondary hover:border-border-strong")} key={tier}>
                    <input checked={approvedTier === tier} className="sr-only" name="approvedTier" onChange={() => { setApprovedTier(tier); setSaved(false); }} type="radio" value={tier} />
                    <TierBadge tier={tier} />
                    <span className="text-sm text-secondary-foreground">{tierMeta[tier].range}</span>
                    <span className={cn("ml-auto grid size-5 place-items-center rounded-full border", approvedTier === tier ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{approvedTier === tier ? <Check size={12} /> : null}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-7 flex flex-col gap-3 border-t border-border pt-6 tablet:flex-row tablet:items-center tablet:justify-between">
              <p className="m-0 max-w-md text-xs leading-5 text-muted-foreground">Changing an approved tier revalidates every affected team. An invalid submitted team returns to draft.</p>
              <button className={cn(buttonBase, "shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover")} onClick={() => setSaved(true)} type="button"><UserRoundCheck size={17} /> Approve {approvedTier}</button>
            </div>
          </Card>

          <aside className="flex flex-col gap-5 desktop:sticky desktop:top-24">
            <Card className="overflow-hidden">
              <div className="border-b border-border p-5"><Kicker>DEFAULT TIER MAP</Kicker><h2 className="mt-2 font-display text-xl font-bold">Rank reference</h2></div>
              <div className="divide-y divide-border">{(Object.keys(tierMeta) as Tier[]).map((tier) => <div className={cn("flex items-center gap-3 p-4", approvedTier === tier && "bg-primary-soft")} key={tier}><TierBadge tier={tier} /><p className="m-0 text-sm text-secondary-foreground">{tierMeta[tier].range}</p></div>)}</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3"><Kicker>QUEUE</Kicker><span className="font-display text-xl font-bold text-warning">6</span></div>
              <p className="mt-3 text-sm leading-5 text-secondary-foreground">Rey is first. Approve one player, then move to the next registration.</p>
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
}: TournamentAppProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <AppHeader region={region} showSignOut={showSignOut} userName={userName} view={view} />
      {view === "registration" ? <RegistrationView deadline={deadline} region={region} tournamentName={tournamentName} /> : null}
      {view === "dashboard" ? <DashboardView deadline={deadline} region={region} tournamentName={tournamentName} userName={userName} /> : null}
      {view === "teams" ? <BrowseTeamsView /> : null}
      {view === "builder" ? <TeamRoomView /> : null}
      {view === "submitted" ? <TeamRoomView initialSubmitted /> : null}
      {view === "admin" ? <OrganizerOverview deadline={deadline} tournamentName={tournamentName} /> : null}
      {view === "tier-review" ? <OrganizerTierReview /> : null}
    </div>
  );
}
