"use client";

import type { FormEvent } from "react";
import { useActionState } from "react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import {
  generateTournamentInvite,
  type InviteCodeState,
  type SettingsState,
  updateTournamentSettings,
} from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimatedButtonLabel } from "@/components/ui/animated-button-label";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="min-h-12 rounded-md bg-primary px-4 py-3 text-base font-bold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      size="lg"
      type="submit"
    >
      <AnimatedButtonLabel stateKey={pending ? "pending" : "ready"}>
        {pending ? "Saving settings..." : "Save settings"}
      </AnimatedButtonLabel>
    </Button>
  );
}

function GenerateButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="min-h-11 rounded-md border border-border bg-secondary px-3.5 py-2.5 text-sm font-bold text-foreground hover:border-border-strong hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      size="lg"
      type="submit"
      variant="secondary"
    >
      <AnimatedButtonLabel stateKey={pending ? "pending" : "ready"}>
        {pending ? "Generating..." : "Generate new code"}
      </AnimatedButtonLabel>
    </Button>
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
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="name">
            Tournament name
          </FieldLabel>
          <Input
            className="min-h-12 rounded-md border-border bg-background px-3.5 text-base"
            defaultValue={name}
            id="name"
            name="name"
            required
            type="text"
          />
        </Field>

        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="region">
            Wild Rift region
          </FieldLabel>
          <Input
            className="min-h-12 rounded-md border-border bg-background px-3.5 text-base"
            defaultValue={region}
            id="region"
            name="region"
            required
            type="text"
          />
        </Field>

        <Field>
          <FieldLabel className="text-sm font-semibold" htmlFor="deadlineLocal">
            Registration deadline <span className="font-normal text-muted-foreground">UTC</span>
          </FieldLabel>
          <Input
            className="min-h-12 rounded-md border-border bg-background px-3.5 text-base"
            defaultValue={registrationDeadline}
            id="deadlineLocal"
            name="deadlineLocal"
            type="datetime-local"
          />
          <FieldDescription className="text-xs">
            Leave this blank to keep registration open. You can extend or clear it later.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <input
        defaultValue={registrationDeadline ? `${registrationDeadline}:00.000Z` : ""}
        name="registrationDeadline"
        type="hidden"
      />

      <Field className="rounded-md border border-border bg-secondary px-3.5 py-3 text-foreground" orientation="horizontal">
        <Switch defaultChecked={inviteEnabled} id="inviteEnabled" name="inviteEnabled" />
        <FieldContent>
          <FieldLabel className="font-semibold" htmlFor="inviteEnabled">
            Accept new friends
          </FieldLabel>
          <FieldDescription className="text-xs">
            Existing participants keep access when this is turned off.
          </FieldDescription>
        </FieldContent>
      </Field>

      {state.error ? (
        <Alert aria-live="polite" className="rounded-md border-danger/30 bg-danger/10 text-danger" variant="destructive">
          <AlertDescription className="text-danger">{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.success ? (
        <Alert aria-live="polite" className="rounded-md border-success/30 bg-success/10 text-success">
          <AlertDescription className="text-success">{state.success}</AlertDescription>
        </Alert>
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogTrigger render={<Button className="min-h-11 self-start rounded-md border border-border bg-secondary px-3.5 py-2.5 text-sm font-bold text-foreground hover:border-border-strong hover:bg-secondary/80" size="lg" variant="secondary" />}>
          Generate new code
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the current invite code?</AlertDialogTitle>
            <AlertDialogDescription>
              Any link or code already shared will stop working immediately. Existing participants keep their access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current code</AlertDialogCancel>
            <form action={formAction} onSubmit={() => setConfirmOpen(false)}>
              <GenerateButton />
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {state.error ? (
        <Alert aria-live="polite" className="rounded-md border-danger/30 bg-danger/10 text-danger" variant="destructive">
          <AlertDescription className="text-danger">{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.code ? (
        <Alert aria-live="polite" className="rounded-md border-primary/30 bg-primary/10 text-foreground">
          <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-primary-muted">
            SHARE THIS CODE
          </p>
          <code className="mt-2 block break-all font-mono text-base font-bold tracking-widest text-foreground">
            {state.code}
          </code>
          <p className="mt-2 mb-0 text-xs leading-5 text-secondary-foreground">
            Copy it now. It will not be shown again, and generating another code invalidates this one.
          </p>
        </Alert>
      ) : null}
    </div>
  );
}
