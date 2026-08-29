"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { joinTournament, type InviteState } from "@/app/invite/actions";

const initialState: InviteState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Checking invite..." : "Enter tournament"}
    </button>
  );
}

export function InviteForm({ initialCode = "" }: { initialCode?: string }) {
  const [state, formAction] = useActionState(joinTournament, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="code">
        Private invite code
        <input
          autoComplete="one-time-code"
          className="min-h-12 rounded-md border border-border bg-background px-3.5 font-mono text-base tracking-widest text-foreground uppercase outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
          defaultValue={initialCode}
          id="code"
          name="code"
          placeholder="ENTER CODE"
          required
          type="text"
        />
      </label>

      {state.error ? (
        <p aria-live="polite" className="m-0 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
