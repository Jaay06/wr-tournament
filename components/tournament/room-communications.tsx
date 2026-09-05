"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, DoorOpen, KeyRound, Megaphone, MessageSquareText, ShieldCheck, SlidersHorizontal, Swords } from "lucide-react";
import { AnnouncementManager } from "@/app/admin/announcement-form";
import { InviteCodeForm, SettingsForm } from "@/app/admin/settings-form";
import { buttonVariants } from "@/components/ui/button";
import type { TournamentAnnouncementData, TournamentTeamData } from "@/lib/tournament-types";
import { validateRoster } from "@/lib/tournament-rules";
import { cn } from "@/lib/utils";

export type RoomSettings = {
  name: string;
  region: string;
  registrationDeadline: string;
  inviteEnabled: boolean;
};

const panel = "rounded-[14px] border border-border bg-card";
const eyebrow = "font-mono text-2xs font-semibold uppercase tracking-[0.18em] text-muted-foreground";

export function AnnouncementTime({ value }: { value: string }) {
  return <time className="font-mono text-2xs text-muted-foreground" dateTime={value}>{new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC</time>;
}

function RoomHeading({ kicker, title, description, children }: { kicker: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div><p className={cn(eyebrow, "m-0 text-primary")}>{kicker}</p><h1 className="mt-2 mb-2 text-[28px] leading-[1.1] font-bold tracking-[-0.035em] desktop:text-[31px]">{title}</h1><p className="m-0 max-w-copy text-sm leading-relaxed text-muted-foreground">{description}</p></div>
    {children}
  </div>;
}

export function ParticipantAnnouncements({ announcements, team, deadlineStatus, deadline }: { announcements: TournamentAnnouncementData[]; team?: TournamentTeamData | null; deadlineStatus: string; deadline: string }) {
  const [latest, ...earlier] = announcements;
  const starterCount = team?.members.filter(member => member.lineupPosition === "starter").length ?? 0;
  const blockers = team ? validateRoster(team.members).blockingIssues.length : 0;
  const submitted = team?.status === "submitted";
  return <>
    <RoomHeading kicker="Tournament feed" title="Stay ahead of the bracket." description="Official updates from the organizers, newest first.">
      <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", deadlineStatus === "passed" ? "border-danger/30 bg-danger-soft" : "border-success/30 bg-success-soft")}>
        <CheckCircle2 className={deadlineStatus === "passed" ? "text-danger" : "text-success"} size={17} />
        <div><p className={cn(eyebrow, "m-0")}>Room status</p><p className="m-0 mt-1 text-xs">Registration {deadlineStatus === "passed" ? "closed" : "open"}</p><p className="mt-1 mb-0 text-xs text-muted-foreground">{deadline}</p></div>
      </div>
    </RoomHeading>
    <div className="grid items-start gap-[18px] desktop:grid-cols-[minmax(0,1fr)_320px]">
      <section className={cn(panel, "min-w-0 overflow-hidden")} aria-label="Tournament announcements">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-[18px]"><div><p className={cn(eyebrow, "m-0")}>Latest update</p><h2 className="mt-1 mb-0 text-lg font-bold">What changed</h2></div><span className={eyebrow}>{announcements.length} posts</span></div>
        {latest ? <article className="flex gap-3 border-l-[3px] border-primary bg-secondary p-[18px] desktop:gap-4 desktop:py-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><CalendarDays size={18} /></span>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="m-0 text-base font-bold wrap-anywhere">{latest.title}</h3><span className={cn(eyebrow, "text-primary")}>Latest</span></div><p className="my-3 text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere text-secondary-foreground">{latest.body}</p><div className="flex flex-wrap items-center gap-2"><Megaphone size={13} className="text-muted-foreground" /><span className={eyebrow}>Organizers</span><AnnouncementTime value={latest.createdAt} /></div></div>
        </article> : <div className="px-6 py-12 text-center"><Megaphone className="mx-auto mb-4 text-muted-foreground" size={28} /><h3 className="text-base font-semibold">No posts yet.</h3><p className="text-sm text-muted-foreground">Official tournament updates will appear here.</p></div>}
        {earlier.length > 0 && <><p className={cn(eyebrow, "m-0 border-y border-border bg-background/40 px-[18px] py-3")}>Earlier</p><div className="divide-y divide-border">{earlier.map(post => <article className="flex gap-3 p-[18px] desktop:gap-4" key={post.id}><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"><MessageSquareText size={17} /></span><div className="min-w-0"><h3 className="m-0 text-sm font-bold wrap-anywhere">{post.title}</h3><p className="my-2 text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere text-secondary-foreground">{post.body}</p><AnnouncementTime value={post.createdAt} /></div></article>)}</div></>}
      </section>
      <aside className="grid gap-4">
        <section className={cn(panel, "p-[18px]")}><div className="flex items-start justify-between gap-3"><div><p className={cn(eyebrow, "m-0 text-primary")}>Right now</p><h2 className="mt-2 mb-0 text-xl font-bold">{submitted ? "Your five is locked." : team ? "Finish the five." : "Find your five."}</h2></div><Swords size={20} className="text-primary" /></div>
          <p className="my-4 text-sm leading-relaxed text-secondary-foreground">{submitted ? "Your roster is submitted. Keep an eye on this feed for the next tournament update." : team ? `Your team has ${starterCount} of five starters. ${starterCount < 5 ? `Fill ${5 - starterCount} more starting ${starterCount === 4 ? "role" : "roles"} and resolve the roster blockers before submission.` : "Resolve any roster blockers before submission."}` : "Create a team or browse the room to join a draft roster."}</p>
          {team && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-3"><span className="text-xs text-muted-foreground">{team.name} roster</span><span className={cn(eyebrow, blockers ? "text-danger" : "text-success")}>{submitted ? "Submitted" : blockers ? `${blockers} blockers` : "Ready"}</span></div>}
          <Link href="/tournament/team" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 w-full gap-2")}>Open team room <ArrowRight size={15} /></Link>
        </section>
        <section className={cn(panel, "p-[18px]")}><p className={cn(eyebrow, "m-0")}>Match comms</p><h2 className="mt-3 mb-2 text-lg font-bold">Stay with the room.</h2><p className="m-0 text-sm leading-relaxed text-muted-foreground">Pairings and match-time coordination remain in Discord. This feed carries official tournament changes.</p></section>
      </aside>
    </div>
  </>;
}

export function OrganizerAnnouncements({ announcements }: { announcements: TournamentAnnouncementData[] }) {
  return <><RoomHeading kicker={`Tournament comms / ${announcements.length} posts`} title="Broadcast the next move." description="One clear update, visible to every player and captain." />
    <AnnouncementManager announcements={announcements} />
  </>;
}

export function OrganizerSettings({ settings, deadlineStatus }: { settings: RoomSettings; deadlineStatus: string }) {
  return <><RoomHeading kicker={`Room control / ${settings.region}`} title="Set the room once." description="Manage the invite gate, registration window and details every participant sees."><span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={16} className="text-success" />Organizer-only controls</span></RoomHeading>
    <div className="grid items-start gap-[18px] desktop:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <section className={cn(panel, "p-5")} id="settings-form"><div className="mb-5 flex items-start justify-between"><div><p className={cn(eyebrow, "m-0")}>Tournament settings</p><h2 className="mt-2 mb-0 text-xl font-bold">Room details</h2></div><SlidersHorizontal size={20} className="text-primary" /></div><SettingsForm {...settings} /></section>
      <div className="grid gap-4"><section className={cn(panel, "p-5")}><div className="flex items-start justify-between gap-3"><div><p className={cn(eyebrow, "m-0 text-primary")}>Private invite</p><h2 className="mt-2 mb-0 text-xl font-bold">Bring people in.</h2></div><KeyRound size={20} className="text-primary" /></div><p className="my-3 text-sm leading-relaxed text-muted-foreground">Generate a code to share with the friends you want in this room. New codes are shown once.</p><InviteCodeForm /></section>
        <section className={cn(panel, "overflow-hidden")}><div className="border-b border-border p-4"><p className={cn(eyebrow, "m-0")}>Change impact</p><h2 className="mt-2 mb-0 text-lg font-bold">What updates touch</h2></div><div className="divide-y divide-border">{[{ Icon: DoorOpen, title: "Invite gate", body: "Controls who can enter the room.", status: settings.inviteEnabled ? "Open" : "Closed" }, { Icon: Clock3, title: "Registration window", body: "Controls profile edits, roster changes and submissions.", status: deadlineStatus === "passed" ? "Closed" : "Open" }].map(({ Icon, title, body, status }) => <div className="flex items-center gap-3 p-4" key={title}><Icon size={18} className="shrink-0 text-primary" /><div className="min-w-0 flex-1"><h3 className="m-0 text-sm font-semibold">{title}</h3><p className="mt-1 mb-0 text-xs leading-relaxed text-muted-foreground">{body}</p></div><span className={cn(eyebrow, status === "Open" ? "text-success" : "text-danger")}>{status}</span></div>)}</div></section>
      </div>
    </div>
  </>;
}
