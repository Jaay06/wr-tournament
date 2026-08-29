import Link from "next/link";

import { EntryShell } from "@/components/auth/entry-shell";
import { firstSearchParam, safeCallbackUrl } from "@/lib/redirect";

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
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <EntryShell
      description="Make an account first. You will still need the private invite from the organizer before you can see the tournament."
      eyebrow="NEW PLAYER"
      title="Pull up a chair."
    >
      <div className="flex flex-col gap-5">
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
