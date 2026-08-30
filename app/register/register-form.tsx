"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  registerWithCredentials,
  type RegisterState,
} from "@/app/register/actions";
import { AnimatedButtonLabel } from "@/components/ui/animated-button-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: RegisterState = {};

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
        {pending ? "Creating account..." : "Create account"}
      </AnimatedButtonLabel>
    </Button>
  );
}

export function RegisterForm({ signInHref }: { signInHref: string }) {
  const [state, formAction] = useActionState(
    registerWithCredentials,
    initialState,
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <Alert aria-live="polite" className="rounded-md border-success/30 bg-success/10 text-success">
          <AlertDescription className="text-success">
            Your account is ready. Sign in to continue to the private invite.
          </AlertDescription>
        </Alert>
        <Link
          className={cn(
            buttonVariants({ size: "lg" }),
            "min-h-12 w-full rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground hover:bg-primary-hover",
          )}
          href={signInHref}
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="displayName">
            Display name
          </FieldLabel>
          <Input
          autoComplete="name"
          className="min-h-12 rounded-md border-border bg-background px-3.5 text-base font-normal"
          id="displayName"
          name="displayName"
          placeholder="What your friends call you"
          required
          type="text"
          />
        </Field>

        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="email">
            Email
          </FieldLabel>
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

        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="password">
            Password
          </FieldLabel>
          <FieldDescription className="text-xs">At least 8 characters.</FieldDescription>
          <Input
          autoComplete="new-password"
          className="min-h-12 rounded-md border-border bg-background px-3.5 text-base font-normal"
          id="password"
          name="password"
          placeholder="Choose a password"
          required
          type="password"
          />
        </Field>
      </FieldGroup>

      {state.error ? (
        <Alert aria-live="polite" className="rounded-md border-danger/30 bg-danger/10 text-danger" variant="destructive">
          <AlertDescription className="text-danger">{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
    </form>
  );
}
