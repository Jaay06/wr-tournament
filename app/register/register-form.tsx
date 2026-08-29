"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  registerWithCredentials,
  type RegisterState,
} from "@/app/register/actions";

const initialState: RegisterState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Creating account..." : "Create account"}
    </button>
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
        <div className="rounded-md border border-success/30 bg-success/10 px-3.5 py-3 text-sm text-success">
          Your account is ready. Sign in to continue to the private invite.
        </div>
        <Link
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted"
          href={signInHref}
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="displayName">
        Display name
        <input
          autoComplete="name"
          className="min-h-12 rounded-md border border-border bg-background px-3.5 text-base font-normal text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
          id="displayName"
          name="displayName"
          placeholder="What your friends call you"
          required
          type="text"
        />
      </label>

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
        <span className="text-xs font-normal text-muted-foreground">At least 8 characters.</span>
        <input
          autoComplete="new-password"
          className="min-h-12 rounded-md border border-border bg-background px-3.5 text-base font-normal text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
          id="password"
          name="password"
          placeholder="Choose a password"
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
