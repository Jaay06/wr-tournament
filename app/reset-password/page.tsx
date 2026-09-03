import Link from "next/link";

import { EntryShell } from "@/components/auth/entry-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ResetPasswordForm } from "./reset-password-form";

type ResetPasswordSearchParams = Promise<{
  token?: string | string[];
}>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: ResetPasswordSearchParams;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <EntryShell
      badgeLabel="ACCOUNT ACCESS"
      description={
        token
          ? "Choose a new password for your Rift Clash account. The link can only be used once."
          : "Use the link from your password reset email, or request a new one."
      }
      eyebrow="PASSWORD RESET"
      title={token ? "Choose a new password." : "Reset link missing."}
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-4" role="status">
          <Alert
            aria-live="polite"
            className="rounded-md border-warning/30 bg-warning/10 text-warning"
          >
            <AlertDescription className="text-warning">
              This page needs the one-time link from your reset email.
            </AlertDescription>
          </Alert>
          <Link
            className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-[transform,background-color] duration-150 ease-out-quad hover:bg-primary-hover active:scale-[0.97] motion-reduce:active:scale-100"
            href="/forgot-password"
          >
            Request a new link
          </Link>
        </div>
      )}
    </EntryShell>
  );
}

