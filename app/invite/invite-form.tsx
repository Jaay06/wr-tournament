"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { REGEXP_ONLY_DIGITS } from "input-otp";

import { joinTournament, type InviteState } from "@/app/invite/actions";
import { AnimatedButtonLabel } from "@/components/ui/animated-button-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const initialState: InviteState = {};

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
        {pending ? "Checking invite..." : "Enter tournament"}
      </AnimatedButtonLabel>
    </Button>
  );
}

export function InviteForm({ initialCode = "" }: { initialCode?: string }) {
  const [state, formAction] = useActionState(joinTournament, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field>
        <FieldLabel className="text-sm font-semibold" htmlFor="code">
          4-digit invite code
        </FieldLabel>
        <FieldDescription className="text-xs">
          Enter the code from the organizer.
        </FieldDescription>
        <InputOTP
          aria-label="4-digit invite code"
          autoComplete="one-time-code"
          className="font-mono text-base tracking-widest"
          containerClassName="w-full"
          defaultValue={initialCode}
          id="code"
          inputMode="numeric"
          maxLength={4}
          name="code"
          pattern={REGEXP_ONLY_DIGITS}
          required
        >
          <InputOTPGroup className="w-full">
            {Array.from({ length: 4 }, (_, index) => (
              <InputOTPSlot
                className="size-12 flex-1 bg-background text-base"
                index={index}
                key={index}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </Field>

      {state.error ? (
        <Alert aria-live="polite" className="rounded-md border-danger/30 bg-danger/10 text-danger" variant="destructive">
          <AlertDescription className="text-danger">{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
    </form>
  );
}
