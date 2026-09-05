"use client";

import type { FormEvent } from "react";
import { useActionState } from "react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, RefreshCw, AlertTriangle } from "lucide-react";

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
      className="h-11 w-full rounded-[10px] px-4 text-sm font-semibold"
      disabled={pending}
      size="lg"
      type="submit"
    >
      <AnimatedButtonLabel stateKey={pending ? "pending" : "ready"}>
        {pending ? "Saving settings..." : "Save settings"}
      </AnimatedButtonLabel>
      <Check size={16} />
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
  const [values, setValues] = useState({ name, region, deadlineLocal: registrationDeadline, inviteEnabled });
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(
    async (previous, data) => {
      try { return await updateTournamentSettings(previous, data); }
      catch { return { error: "Settings could not be saved. Your changes are still here; try again." }; }
    }, {},
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
      <FieldGroup className="grid gap-4 tablet:grid-cols-2">
        <Field className="tablet:col-span-2">
          <FieldLabel className="text-sm font-semibold" htmlFor="name">
            Tournament name
          </FieldLabel>
          <Input
            className="h-11 rounded-lg border-border bg-background px-3 text-sm"
            value={values.name}
            onChange={event => setValues({ ...values, name: event.target.value })}
            maxLength={80}
            disabled={pending}
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
            className="h-11 rounded-lg border-border bg-background px-3 text-sm"
            value={values.region}
            onChange={event => setValues({ ...values, region: event.target.value })}
            minLength={2}
            maxLength={40}
            disabled={pending}
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
            className="h-11 min-w-0 rounded-lg border-border bg-background px-3 text-sm"
            value={values.deadlineLocal}
            onChange={event => setValues({ ...values, deadlineLocal: event.target.value })}
            disabled={pending}
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
        <FieldContent>
          <FieldLabel className="font-semibold" htmlFor="inviteEnabled">
            Accept new friends
          </FieldLabel>
          <FieldDescription className="text-xs">
            Existing participants keep access when this is turned off.
          </FieldDescription>
        </FieldContent>
        <Switch checked={values.inviteEnabled} onCheckedChange={checked => setValues({ ...values, inviteEnabled: checked })} disabled={pending} id="inviteEnabled" name="inviteEnabled" />
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
  const [copyState, setCopyState] = useState("");

  async function copyCode() {
    if (!state.code) return;
    try { await navigator.clipboard.writeText(state.code); setCopyState("Copied"); }
    catch { setCopyState("Copy failed. Select and copy the code above."); }
  }

  return (
    <div className="flex flex-col gap-4">
      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogTrigger render={<Button className="h-11 w-full gap-2 rounded-lg" size="lg" variant="outline" />}>
          <RefreshCw size={15} />
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
          <Button type="button" variant="secondary" className="mt-3 h-11 gap-2" onClick={copyCode}><Copy size={15} />{copyState === "Copied" ? "Copied" : "Copy code"}</Button>
          {copyState && <p role="status" className="mt-2 text-xs">{copyState}</p>}
          <p className="mt-2 mb-0 text-xs leading-5 text-secondary-foreground">
            Copy it now. It will not be shown again, and generating another code invalidates this one.
          </p>
        </Alert>
      ) : null}
      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-xs leading-relaxed text-warning"><AlertTriangle size={15} className="shrink-0" /><p className="m-0">A new code immediately invalidates every invite link already shared.</p></div>
    </div>
  );
}
