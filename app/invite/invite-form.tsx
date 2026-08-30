"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { joinTournament, type InviteState } from "@/app/invite/actions";
import { AnimatedButtonLabel } from "@/components/ui/animated-button-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
          Invite code
        </FieldLabel>
        <FieldDescription className="text-xs">
          Paste the private code from the organizer.
        </FieldDescription>
        <Input
          aria-label="Invite code"
          autoComplete="one-time-code"
          className="min-h-12 rounded-xl bg-background font-mono text-base tracking-[0.12em] uppercase"
          defaultValue={initialCode}
          id="code"
          maxLength={32}
          name="code"
          spellCheck={false}
          required
        />
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
