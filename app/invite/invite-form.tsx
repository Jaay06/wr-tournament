"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { AnimatedButtonLabel } from "@/components/ui/animated-button-label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function SubmitButton({ pending }: { pending: boolean }) {
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
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPending(true);

    try {
      const response = await fetch("/api/tournament/join", {
        method: "POST",
        body: new FormData(event.currentTarget),
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        redirectTo?: "/tournament" | "/tournament/register";
      } | null;

      if (!response.ok) {
        setError(result?.error ?? "We couldn't check the invite. Refresh and try again.");
        return;
      }

      if (!result?.redirectTo) {
        setError("We couldn't open the tournament. Refresh and try again.");
        return;
      }

      window.location.assign(result.redirectTo);
    } catch {
      setError("We couldn't check the invite. Refresh and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
          inputMode="numeric"
          maxLength={4}
          name="code"
          pattern="[0-9]{4}"
          spellCheck={false}
          required
        />
      </Field>

      {error ? (
        <Alert aria-live="polite" className="rounded-md border-danger/30 bg-danger/10 text-danger" variant="destructive">
          <AlertDescription className="text-danger">{error}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton pending={pending} />
    </form>
  );
}
