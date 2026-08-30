import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentSettings } from "@/db/schema";
import { getOrganizerOverviewData } from "@/lib/tournament-data";
import { getAnnouncements } from "@/lib/tournament-data";
import { formatDeadline, toDateTimeLocalValue } from "@/lib/tournament";

import { InviteCodeForm, SettingsForm } from "./settings-form";
import { AnnouncementManager } from "./announcement-form";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "organizer") {
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

  const overview = await getOrganizerOverviewData();
  const announcements = await getAnnouncements();

  return (
    <div className="min-h-svh bg-background text-foreground">
      <TournamentApp
        deadline={formatDeadline(settings?.registrationDeadline)}
        region={settings?.region}
        showSignOut
        overview={overview}
        tournamentName={settings?.name}
        userName={session.user.name ?? "organizer"}
        view="admin"
      />

      <section className="mx-auto w-full max-w-page px-5 pb-12 desktop:px-12" id="settings-form">
        {!settings ? (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm text-warning">
            Run <code className="font-mono">pnpm db:setup</code> before editing the tournament.
          </div>
        ) : (
          <div className="grid gap-4 desktop:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-6">
                <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
                  TOURNAMENT SETTINGS
                </p>
                <h2 className="mt-2 mb-0 font-display text-xl font-bold">Keep the details current</h2>
              </div>
              <SettingsForm
                inviteEnabled={settings.inviteEnabled}
                name={settings.name}
                region={settings.region}
                registrationDeadline={toDateTimeLocalValue(settings.registrationDeadline)}
              />
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
                PRIVATE INVITE
              </p>
              <h2 className="mt-2 mb-0 font-display text-xl font-bold">Issue a code</h2>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-secondary-foreground">
                Generate a new random code whenever you need one. The previous code stops working immediately.
              </p>
              <InviteCodeForm />
            </section>
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-page px-5 pb-12 desktop:px-12">
        <AnnouncementManager announcements={announcements} />
      </section>
    </div>
  );
}
