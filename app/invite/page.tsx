import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { EntryShell } from "@/components/auth/entry-shell";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import { firstSearchParam } from "@/lib/redirect";
import { formatDeadline } from "@/lib/tournament";

import { InviteForm } from "./invite-form";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Finvite");
  }

  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);

  if (participant) {
    redirect("/tournament");
  }

  const [settings] = await db
    .select({
      name: tournamentSettings.name,
      region: tournamentSettings.region,
      inviteEnabled: tournamentSettings.inviteEnabled,
      registrationDeadline: tournamentSettings.registrationDeadline,
    })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  const params = await searchParams;
  const initialCode = firstSearchParam(params.code) ?? "";

  return (
    <EntryShell
      description="Use the code from the organizer to enter this private tournament. Your registration and team details stay inside the room."
      eyebrow="PRIVATE INVITE"
      title={settings?.name ?? "Enter the tournament"}
    >
      <div className="flex flex-col gap-5">
        {settings ? (
          <div className="grid grid-cols-2 gap-3 max-phone:grid-cols-1">
            <div className="rounded-md border border-border bg-secondary px-3.5 py-3">
              <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
                REGION
              </p>
              <p className="mt-1 mb-0 text-sm font-semibold text-foreground">{settings.region}</p>
            </div>
            <div className="rounded-md border border-border bg-secondary px-3.5 py-3">
              <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
                REGISTRATION CLOSES
              </p>
              <p className="mt-1 mb-0 text-sm font-semibold text-foreground">
                {formatDeadline(settings.registrationDeadline)}
              </p>
              {!settings.registrationDeadline ? (
                <p className="mt-1 mb-0 text-xs leading-5 text-muted-foreground">
                  The organizer has not set a closing time.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {!settings ? (
          <p className="m-0 rounded-md border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning">
            The organizer still needs to run the tournament setup command before friends can join.
          </p>
        ) : !settings.inviteEnabled ? (
          <p className="m-0 rounded-md border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning">
            The organizer has closed the invite. Existing participants can still use the tournament.
          </p>
        ) : (
          <InviteForm initialCode={initialCode} />
        )}

        <p className="m-0 text-center text-sm text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{session.user.name ?? session.user.email}</span>{" "}
          · <Link className="font-semibold text-primary-muted hover:text-primary" href="/">Leave</Link>
        </p>
      </div>
    </EntryShell>
  );
}
