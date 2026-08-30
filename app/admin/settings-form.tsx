"use client";

import type { FormEvent } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  generateTournamentInvite,
  type InviteCodeState,
  type SettingsState,
  updateTournamentSettings,
} from "./actions";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving settings..." : "Save settings"}
    </button>
  );
}

function GenerateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-secondary px-3.5 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-border-strong hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Generating..." : "Generate new code"}
    </button>
  );
}

export function SettingsForm({
  name,
  region,
  registrationDeadline,
  inviteEnabled,
}: {
  name: string;
  region: string;
  registrationDeadline: string;
  inviteEnabled: boolean;
}) {
  const [state, formAction] = useActionState<SettingsState, FormData>(
    updateTournamentSettings,
    {},
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const localDeadline = new FormData(form).get("deadlineLocal");
    const hiddenDeadline = form.elements.namedItem("registrationDeadline");

    if (hiddenDeadline instanceof HTMLInputElement) {
      if (typeof localDeadline === "string" && localDeadline) {
        const parsedDeadline = new Date(`${localDeadline}Z`);

        hiddenDeadline.value = Number.isNaN(parsedDeadline.getTime())
          ? ""
          : parsedDeadline.toISOString();
      } else {
        hiddenDeadline.value = "";
      }
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="name">
        Tournament name
        <input
          className="min-h-12 rounded-md border border-border bg-background px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
          defaultValue={name}
          id="name"
          name="name"
          required
          type="text"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="region">
        Wild Rift region
        <input
          className="min-h-12 rounded-md border border-border bg-background px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
          defaultValue={region}
          id="region"
          name="region"
          required
          type="text"
        />
      </label>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="deadlineLocal">
          Registration deadline <span className="font-normal text-muted-foreground">UTC</span>
          <input
            className="min-h-12 rounded-md border border-border bg-background px-3.5 text-base text-foreground outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"
            defaultValue={registrationDeadline}
            id="deadlineLocal"
            name="deadlineLocal"
            type="datetime-local"
          />
        </label>
        <input
          defaultValue={registrationDeadline ? `${registrationDeadline}:00.000Z` : ""}
          name="registrationDeadline"
          type="hidden"
        />
        <p className="m-0 text-xs leading-5 text-muted-foreground">
          Leave this blank to keep registration open. You can extend or clear it later.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-md border border-border bg-secondary px-3.5 py-3 text-sm text-foreground">
        <input
          className="mt-0.5 size-4 accent-primary"
          defaultChecked={inviteEnabled}
          name="inviteEnabled"
          type="checkbox"
        />
        <span>
          <strong className="block font-semibold">Accept new friends</strong>
          <small className="mt-1 block text-xs leading-5 text-muted-foreground">
            Existing participants keep access when this is turned off.
          </small>
        </span>
      </label>

      {state.error ? (
        <p aria-live="polite" className="m-0 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p aria-live="polite" className="m-0 rounded-md border border-success/30 bg-success/10 px-3.5 py-3 text-sm text-success">
          {state.success}
        </p>
      ) : null}

      <SaveButton />
    </form>
  );
}

export function InviteCodeForm() {
  const [state, formAction] = useActionState<InviteCodeState, FormData>(
    generateTournamentInvite,
    {},
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction}>
        <GenerateButton />
      </form>

      {state.error ? (
        <p aria-live="polite" className="m-0 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      {state.code ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-3.5 py-3">
          <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-primary-muted">
            SHARE THIS CODE
          </p>
          <code className="mt-2 block break-all font-mono text-base font-bold tracking-widest text-foreground">
            {state.code}
          </code>
          <p className="mt-2 mb-0 text-xs leading-5 text-secondary-foreground">
            Copy it now. It will not be shown again, and generating another code invalidates this one.
          </p>
        </div>
      ) : null}
    </div>
  );
}
