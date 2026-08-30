import Link from "next/link";

import { discordEnabled } from "@/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldSeparator } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { CredentialsForm } from "./credentials-form";
import { EntryShell } from "@/components/auth/entry-shell";
import { DiscordSignInButton } from "@/components/auth/discord-signin-button";
import { firstSearchParam, safeCallbackUrl } from "@/lib/redirect";
import { getInviteIntentStatus } from "@/lib/invite-intent";

type SignInSearchParams = Promise<{
  callbackUrl?: string | string[];
  created?: string | string[];
  error?: string | string[];
}>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SignInSearchParams;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(firstSearchParam(params.callbackUrl));
  const error = firstSearchParam(params.error);
  const created = firstSearchParam(params.created) === "1";
  const registerUrl = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const inviteStatus = await getInviteIntentStatus(callbackUrl);
  const inviteRecognized = inviteStatus === "recognized";

  return (
    <EntryShell
      description={inviteRecognized ? "Your private invite is ready. Sign in and we will take you straight back to the code." : "Sign in first. If the organizer invited you, you will enter the private tournament room next."}
      eyebrow="PRIVATE ACCESS"
      title={inviteRecognized ? "Your invite is ready." : "Get back in the room."}
    >
      <div className="flex flex-col gap-5">
        {inviteRecognized ? (
          <Card className="rounded-2xl border-primary/25 bg-primary-soft p-4" role="status">
            <p className="m-0 font-mono text-2xs font-semibold tracking-[0.12em] text-primary-muted">INVITE RECOGNIZED</p>
            <p className="mt-2 mb-0 text-sm leading-5 text-secondary-foreground">The invite code will stay attached while you sign in or create an account.</p>
          </Card>
        ) : null}
        {inviteStatus === "invalid" || inviteStatus === "closed" ? (
          <Alert className="rounded-md border-warning/30 bg-warning/10 text-warning" role="status">
            <AlertDescription className="text-warning">
              {inviteStatus === "closed"
                ? "The organizer has paused new entries. You can still sign in to an existing tournament account."
                : "That invite could not be verified. Sign in to enter a current code or ask the organizer for a new link."}
            </AlertDescription>
          </Alert>
        ) : null}
        <div>
          <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
            SIGN IN
          </p>
          <h2 className="mt-2 mb-0 font-display text-xl font-bold leading-7">
            Use your tournament account
          </h2>
        </div>

        {created ? (
          <Alert aria-live="polite" className="rounded-md border-success/30 bg-success/10 text-success">
            <AlertDescription className="text-success">Account created. Sign in to continue.</AlertDescription>
          </Alert>
        ) : null}

        {error === "AccountLinkRequired" ? (
          <Alert aria-live="polite" className="rounded-md border-warning/30 bg-warning/10 text-warning">
            <AlertDescription className="text-warning">
              That Discord email already belongs to an email account. Sign in with your email and password for now.
            </AlertDescription>
          </Alert>
        ) : null}

        {discordEnabled ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">RECOMMENDED</p>
            <DiscordSignInButton callbackUrl={callbackUrl} />
          </div>
        ) : (
          <Alert className="rounded-md border-border bg-secondary text-muted-foreground">
            <AlertDescription className="text-muted-foreground">
              Discord sign-in will appear after the organizer adds the Discord OAuth keys.
            </AlertDescription>
          </Alert>
        )}

        <FieldSeparator className="my-0 text-2xs font-mono tracking-widest">OR</FieldSeparator>

        <div className="flex flex-col gap-3">
          <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
            EMAIL + PASSWORD
          </p>
          <div className="[&>form]:flex [&>form]:flex-col [&>form]:gap-4">
            {/** The client form owns validation state and pending UI. */}
            <CredentialsForm callbackUrl={callbackUrl} />
          </div>
        </div>

        <p className="m-0 text-center text-sm text-muted-foreground">
          New to Rift Clash?{" "}
          <Link className="font-semibold text-primary-muted hover:text-primary" href={registerUrl}>
            Create an account
          </Link>
        </p>
      </div>
    </EntryShell>
  );
}
