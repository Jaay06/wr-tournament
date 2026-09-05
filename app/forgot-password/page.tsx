import Link from "next/link";

import { EntryShell } from "@/components/auth/entry-shell";
import { Card } from "@/components/ui/card";

import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <EntryShell
      badgeLabel="ACCOUNT ACCESS"
      description="Enter the email on your Rift Clash account. We will send a one-time reset link when an eligible account exists."
      eyebrow="ACCOUNT RECOVERY"
      title="Back in before draft lock."
    >
      <div className="flex flex-col gap-5">
        <Card className="rounded-2xl border-primary/25 bg-primary-soft p-4" role="note">
          <p className="m-0 font-mono text-2xs font-semibold tracking-[0.12em] text-primary-muted">
            ONE-TIME LINK
          </p>
          <p className="mt-2 mb-0 text-sm leading-5 text-secondary-foreground">
            Reset links expire after a short time and work once.
          </p>
        </Card>

        <ForgotPasswordForm />

        <p className="m-0 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link
            className="font-semibold text-primary-muted hover:text-primary"
            href="/signin"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </EntryShell>
  );
}
