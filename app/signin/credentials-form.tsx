"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  signInWithCredentials,
  type SignInState,
} from "@/app/signin/actions";

const initialState: SignInState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

export function CredentialsForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(
    signInWithCredentials,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input name="callbackUrl" type="hidden" value={callbackUrl} />

      <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="email">
        Email
        <input
          autoComplete="email"
          className="min-h-12 rounded-md border border-border bg-background px-3.5 text-base font-normal text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="password">
        Password
        <input
          autoComplete="current-password"
          className="min-h-12 rounded-md border border-border bg-background px-3.5 text-base font-normal text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
          id="password"
          name="password"
          placeholder="Your password"
          required
          type="password"
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
