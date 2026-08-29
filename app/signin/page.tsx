import Link from "next/link";

import { discordEnabled } from "@/auth";
import { CredentialsForm } from "./credentials-form";
import { EntryShell } from "@/components/auth/entry-shell";
import { DiscordSignInButton } from "@/components/auth/discord-signin-button";
import { firstSearchParam, safeCallbackUrl } from "@/lib/redirect";

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

  return (
    <EntryShell
      description="Sign in first. If the organizer invited you, you will enter the private tournament room next."
      eyebrow="PRIVATE ACCESS"
      title="Get back in the room."
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
            SIGN IN
          </p>
          <h2 className="mt-2 mb-0 font-display text-xl font-bold leading-7">
            Use your tournament account
          </h2>
        </div>

        {created ? (
          <p className="m-0 rounded-md border border-success/30 bg-success/10 px-3.5 py-3 text-sm text-success">
            Account created. Sign in to continue.
          </p>
        ) : null}

        {error === "AccountLinkRequired" ? (
          <p className="m-0 rounded-md border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-warning">
            That Discord email already belongs to an email account. Sign in with your email and password for now.
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
            EMAIL + PASSWORD
          </p>
          <div className="[&>form]:flex [&>form]:flex-col [&>form]:gap-4">
            {/** The client form owns validation state and pending UI. */}
            <CredentialsForm callbackUrl={callbackUrl} />
          </div>
        </div>

        <div className="flex items-center gap-3 text-2xs font-mono tracking-widest text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          OR
        </div>

        {discordEnabled ? (
          <DiscordSignInButton callbackUrl={callbackUrl} />
        ) : (
          <p className="m-0 rounded-md border border-border bg-secondary px-3.5 py-3 text-sm text-muted-foreground">
            Discord sign-in will appear after the organizer adds the Discord OAuth keys.
          </p>
        )}

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
