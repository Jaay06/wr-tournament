"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  resetPassword,
  type ResetPasswordState,
} from "@/app/reset-password/actions";
import { AnimatedButtonLabel } from "@/components/ui/animated-button-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: ResetPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="min-h-12 w-full rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      size="lg"
      type="submit"
    >
      <AnimatedButtonLabel stateKey={pending ? "pending" : "ready"}>
        {pending ? "Updating password..." : "Update password"}
      </AnimatedButtonLabel>
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(
    resetPassword,
    initialState,
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <Alert
          aria-live="polite"
          className="rounded-md border-success/30 bg-success/10 text-success"
        >
          <AlertDescription className="text-success">
            Your password has been updated. Sign in with the new password.
          </AlertDescription>
        </Alert>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-[transform,background-color] duration-150 ease-out-quad hover:bg-primary-hover active:scale-[0.97] motion-reduce:active:scale-100"
          href="/signin"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input name="token" type="hidden" value={token} />

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="password">
            New password
          </FieldLabel>
          <FieldDescription className="text-xs">
            Use at least 8 characters.
          </FieldDescription>
          <Input
            autoComplete="new-password"
            className="min-h-12 rounded-md border-border bg-background px-3.5 text-base font-normal"
            id="password"
            name="password"
            placeholder="Choose a new password"
            required
            type="password"
          />
        </Field>

        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="confirmPassword">
            Confirm new password
          </FieldLabel>
          <Input
            autoComplete="new-password"
            className="min-h-12 rounded-md border-border bg-background px-3.5 text-base font-normal"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Enter it again"
            required
            type="password"
          />
        </Field>
      </FieldGroup>

      {state.error ? (
        <Alert
          aria-live="polite"
          className="rounded-md border-danger/30 bg-danger/10 text-danger"
          variant="destructive"
        >
          <AlertDescription className="text-danger">
            {state.error}
          </AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />

      <p className="m-0 text-center text-sm text-muted-foreground">
        Need a fresh link?{" "}
        <Link
          className="font-semibold text-primary-muted hover:text-primary"
          href="/forgot-password"
        >
          Request another
        </Link>
      </p>
    </form>
  );
}

