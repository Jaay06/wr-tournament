"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { TournamentAnnouncementData } from "@/lib/tournament-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AnimatedButtonLabel } from "@/components/ui/animated-button-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";

import {
  createAnnouncement,
  deleteAnnouncement,
  type AnnouncementState,
} from "./actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="min-h-11 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      size="lg"
      type="submit"
    >
      <AnimatedButtonLabel stateKey={pending ? "pending" : "ready"}>
        {pending ? "Saving..." : children}
      </AnimatedButtonLabel>
    </Button>
  );
}

export function AnnouncementManager({
  announcements,
}: {
  announcements: TournamentAnnouncementData[];
}) {
  const [state, formAction] = useActionState<AnnouncementState, FormData>(
    createAnnouncement,
    {},
  );
  const [deleteState, deleteAction] = useActionState<AnnouncementState, FormData>(
    deleteAnnouncement,
    {},
  );

  return (
    <Card className="rounded-2xl border border-border bg-card gap-0 p-5" id="announcement-form">
      <div className="mb-6">
        <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">ANNOUNCEMENTS</p>
        <h2 className="mt-2 mb-0 font-display text-xl font-bold">Keep everyone in the loop</h2>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel className="text-sm font-semibold" htmlFor="announcement-title">Title</FieldLabel>
            <Input className="min-h-12 rounded-xl border-border bg-background px-3.5 text-base" id="announcement-title" name="title" placeholder="Registration closes Sunday" required />
          </Field>
          <Field>
            <FieldLabel className="text-sm font-semibold" htmlFor="announcement-body">Message</FieldLabel>
            <Textarea className="min-h-28 rounded-xl border-border bg-background px-3.5 py-3 text-base" id="announcement-body" name="body" placeholder="Submit your roster before the deadline." required />
            <FieldDescription className="text-xs">Keep this short. Participants see it in their tournament feed.</FieldDescription>
          </Field>
        </FieldGroup>
        {state.error ? <Alert aria-live="polite" className="rounded-xl border-danger/30 bg-danger-soft text-danger" variant="destructive"><AlertDescription className="text-danger">{state.error}</AlertDescription></Alert> : null}
        {state.success ? <Alert aria-live="polite" className="rounded-xl border-success/30 bg-success-soft text-success"><AlertDescription className="text-success">{state.success}</AlertDescription></Alert> : null}
        <SubmitButton>Post announcement</SubmitButton>
      </form>

      <div className="mt-7 border-t border-border pt-5">
        <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">POSTED</p>
        {announcements.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {announcements.map((announcement) => (
              <Item className="rounded-xl border-border bg-secondary p-4" key={announcement.id} variant="outline">
                <ItemContent>
                  <ItemTitle>{announcement.title}</ItemTitle>
                  <ItemDescription className="mt-2 text-sm leading-5 text-secondary-foreground">
                    {announcement.body}
                  </ItemDescription>
                  <p className="mt-3 font-mono text-2xs text-muted-foreground">
                    {new Date(announcement.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </p>
                </ItemContent>
                <ItemActions>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button className="min-h-9 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-danger/40 hover:text-danger" size="sm" variant="outline" />}>
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the announcement from every participant&apos;s feed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <form action={deleteAction}>
                          <input name="id" type="hidden" value={announcement.id} />
                          <AlertDialogAction type="submit" variant="destructive">Delete</AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </ItemActions>
              </Item>
            ))}
          </div>
        )}
        {deleteState.error ? <Alert aria-live="polite" className="mt-3 rounded-xl border-danger/30 bg-danger-soft text-danger" variant="destructive"><AlertDescription className="text-danger">{deleteState.error}</AlertDescription></Alert> : null}
        {deleteState.success ? <Alert aria-live="polite" className="mt-3 rounded-xl border-success/30 bg-success-soft text-success"><AlertDescription className="text-success">{deleteState.success}</AlertDescription></Alert> : null}
      </div>
    </Card>
  );
}
