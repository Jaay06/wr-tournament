"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestPasswordReset,
  type PasswordResetRequestState,
} from "@/app/forgot-password/actions";
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

const initialState: PasswordResetRequestState = {};

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
        {pending ? "Sending instructions..." : "Send reset link"}
      </AnimatedButtonLabel>
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordReset,
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
            {state.success} Check your inbox and spam folder.
          </AlertDescription>
        </Alert>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-[transform,background-color] duration-150 ease-out-quad hover:bg-primary-hover active:scale-[0.97] motion-reduce:active:scale-100"
          href="/signin"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="email">
            Email
          </FieldLabel>
          <FieldDescription className="text-xs">
            Use the email you used when you created your account.
          </FieldDescription>
          <Input
            autoComplete="email"
            className="min-h-12 rounded-md border-border bg-background px-3.5 text-base font-normal"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
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
    </form>
  );
}

