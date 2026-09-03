import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EntryShell } from "@/components/auth/entry-shell";
import { Card } from "@/components/ui/card";
import {
  firstSearchParam,
  postAuthRedirectPath,
  safeCallbackUrl,
} from "@/lib/redirect";
import { getInviteIntentStatus } from "@/lib/invite-intent";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { RegisterForm } from "./register-form";

type RegisterSearchParams = Promise<{
  callbackUrl?: string | string[];
}>;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: RegisterSearchParams;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(firstSearchParam(params.callbackUrl));
  const session = await auth();

  if (session?.user?.id) {
    redirect(postAuthRedirectPath(callbackUrl));
  }

  const signInHref = `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const inviteStatus = await getInviteIntentStatus(callbackUrl);
  const inviteRecognized = inviteStatus === "recognized";

  return (
    <EntryShell
      description={inviteRecognized ? "Create your account and we will take you back to the private invite without making you enter the code twice." : "Make an account first. You will still need the private invite from the organizer before you can see the tournament."}
      eyebrow="NEW PLAYER"
      title={inviteRecognized ? "Keep your invite." : "Pull up a chair."}
    >
      <div className="flex flex-col gap-5">
        {inviteRecognized ? (
          <Card className="rounded-2xl border-primary/25 bg-primary-soft p-4" role="status">
            <p className="m-0 font-mono text-2xs font-semibold tracking-[0.12em] text-primary-muted">INVITE RECOGNIZED</p>
            <p className="mt-2 mb-0 text-sm leading-5 text-secondary-foreground">Your invite intent is saved. Finish account setup, then we will return you to the code.</p>
          </Card>
        ) : null}
        {inviteStatus === "invalid" || inviteStatus === "closed" ? (
          <Alert className="rounded-md border-warning/30 bg-warning/10 text-warning" role="status">
            <AlertDescription className="text-warning">
              {inviteStatus === "closed"
                ? "The organizer has paused new entries. You can create an account now, but joining remains closed."
                : "That invite could not be verified. Create your account, then ask the organizer for a current code."}
            </AlertDescription>
          </Alert>
        ) : null}
        <div>
          <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
            CREATE ACCOUNT
          </p>
          <h2 className="mt-2 mb-0 font-display text-xl font-bold leading-7">
            Set up your login
          </h2>
        </div>

        <RegisterForm signInHref={signInHref} />

        <p className="m-0 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-semibold text-primary-muted hover:text-primary" href={signInHref}>
            Sign in
          </Link>
        </p>
      </div>
    </EntryShell>
  );
}
