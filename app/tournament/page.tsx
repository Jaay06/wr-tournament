import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import { formatDeadline } from "@/lib/tournament";

export default async function TournamentPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Ftournament");
  }

  const [participant] = await db
    .select({ joinedAt: tournamentParticipants.joinedAt })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);

  if (!participant) {
    redirect("/invite");
  }

  const [settings] = await db
    .select({
      name: tournamentSettings.name,
      region: tournamentSettings.region,
      registrationDeadline: tournamentSettings.registrationDeadline,
    })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  if (!settings) {
    redirect("/invite");
  }

  return (
    <div className="min-h-svh bg-background px-5 py-6 text-foreground max-tablet:px-4 max-tablet:py-4">
      <header className="mx-auto flex w-full max-w-page items-center justify-between gap-5 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">
            WR
          </span>
          <div className="flex flex-col">
            <strong className="text-base font-bold leading-4.5 tracking-[-0.02em]">RIFT CLASH</strong>
            <small className="font-mono text-3xs leading-3.25 tracking-[0.12em] text-muted-foreground max-phone:hidden">
              PRIVATE TOURNAMENT ROOM
            </small>
          </div>
        </div>
        <SignOutButton />
      </header>

      <main className="mx-auto w-full max-w-page py-16 max-tablet:py-10">
        <section className="max-w-copy">
          <p className="m-0 flex items-center gap-2.5 font-mono text-xs font-semibold tracking-[0.13em] text-success">
            <span className="size-1.75 rounded-full bg-success" aria-hidden="true" />
            YOU ARE IN
          </p>
          <h1 className="mt-5.5 mb-0 font-display text-3xl font-extrabold leading-[0.98] tracking-[-0.055em] text-primary max-phone:text-2xl">
            {settings.name}
          </h1>
          <p className="mt-5.5 mb-0 text-lg leading-[1.6] text-secondary-foreground max-phone:text-base">
            Welcome in, {session.user.name ?? "player"}. This is the private room for the group.
          </p>
        </section>

        <section className="mt-10 grid max-w-page grid-cols-3 gap-3.5 max-tablet:grid-cols-1">
          <article className="rounded-card border border-border bg-card p-5">
            <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">REGION</p>
            <p className="mt-2 mb-0 font-display text-xl font-bold">{settings.region}</p>
          </article>
          <article className="rounded-card border border-border bg-card p-5">
            <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">REGISTRATION CLOSES</p>
            <p className="mt-2 mb-0 font-display text-xl font-bold">{formatDeadline(settings.registrationDeadline)}</p>
          </article>
          <article className="rounded-card border border-border bg-card p-5">
            <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">JOINED</p>
            <p className="mt-2 mb-0 font-display text-xl font-bold">{formatDeadline(participant.joinedAt)}</p>
          </article>
        </section>

        <section className="mt-3.5 max-w-copy rounded-card border border-border bg-card p-5">
          <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-primary-muted">NEXT UP</p>
          <h2 className="mt-2 mb-0 font-display text-xl font-bold">Player registration</h2>
          <p className="mt-2 mb-0 text-sm leading-[1.55] text-secondary-foreground">
            The account and invite gate are ready. Registration for Riot ID, tier, and role preferences is the next part of the room.
          </p>
        </section>
      </main>
    </div>
  );
}
