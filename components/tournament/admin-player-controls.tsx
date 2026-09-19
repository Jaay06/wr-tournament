"use client";

import { useActionState, useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";

import {
  softDeletePlayerAsOrganizer,
  type TeamAdminState,
} from "@/app/admin/actions";
import { approveRegistrationTier } from "@/app/tournament/actions";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { TournamentPlayerProfileData } from "@/lib/tournament-types";

type AdminPlayerControlsProps = {
  player: TournamentPlayerProfileData;
};

export function AdminPlayerControls({ player }: AdminPlayerControlsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tierState, tierAction, tierPending] = useActionState(
    approveRegistrationTier,
    {},
  );
  const [deleteState, deleteAction, deletePending] = useActionState<
    TeamAdminState,
    FormData
  >(softDeletePlayerAsOrganizer, {});

  if (player.isDeleted) return null;

  return (
    <Card className="rounded-card border-border bg-card p-5 tablet:p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 shrink-0 text-primary-muted" size={19} />
        <div>
          <p className="m-0 font-mono text-2xs font-semibold tracking-[0.14em] text-primary-muted">
            ORGANIZER CONTROLS
          </p>
          <h2 className="mt-2 mb-0 font-display text-xl font-bold">
            Manage player
          </h2>
        </div>
      </div>

      <form
        action={tierAction}
        className="mt-5 grid gap-3 rounded-xl border border-border bg-secondary/45 p-4 tablet:grid-cols-[minmax(0,1fr)_180px_auto] tablet:items-end"
      >
        <div>
          <p className="m-0 text-sm font-semibold">Approved tier</p>
          <p className="mt-1 mb-0 text-xs leading-5 text-muted-foreground">
            Saving a tier revalidates the player&apos;s submitted team.
          </p>
        </div>
        <input name="registrationId" type="hidden" value={player.id} />
        <label className="grid gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tier
          <NativeSelect
            defaultValue={player.approvedTier ?? ""}
            disabled={tierPending}
            name="approvedTier"
            required
          >
            <NativeSelectOption disabled value="">
              Choose tier
            </NativeSelectOption>
            {(["T1", "T2", "T3", "T4"] as const).map((tier) => (
              <NativeSelectOption key={tier} value={tier}>
                {tier}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <Button disabled={tierPending} size="lg" type="submit">
          {tierPending ? "Saving..." : "Save tier"}
        </Button>
      </form>
      {tierState.error ? (
        <Alert aria-live="polite" className="mt-3" variant="destructive">
          <AlertDescription>{tierState.error}</AlertDescription>
        </Alert>
      ) : null}
      {tierState.success ? (
        <Alert
          aria-live="polite"
          className="mt-3 border-success/30 bg-success-soft text-success"
        >
          <AlertDescription className="text-success">
            {tierState.success}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <p className="m-0 text-sm font-semibold">Soft-delete player</p>
          <p className="mt-1 mb-0 max-w-2xl text-xs leading-5 text-muted-foreground">
            Removes account access and hides the player from active directories.
            This cannot be undone from the admin interface.
          </p>
        </div>
        <AlertDialog
          onOpenChange={(open) => {
            if (!deletePending) setDeleteOpen(open);
          }}
          open={deleteOpen}
        >
          <AlertDialogTrigger
            render={
              <Button
                className="shrink-0"
                disabled={deletePending}
                size="lg"
                type="button"
                variant="destructive"
              />
            }
          >
            <Trash2 size={16} /> Delete player
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {player.displayName}?</AlertDialogTitle>
              <AlertDialogDescription>
                Their account will lose access and disappear from active player
                lists. They will be removed from their roster. If they captain a
                team, that team and its pending requests will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePending}>
                Keep player
              </AlertDialogCancel>
              <form action={deleteAction}>
                <input name="registrationId" type="hidden" value={player.id} />
                <AlertDialogAction
                  disabled={deletePending}
                  type="submit"
                  variant="destructive"
                >
                  {deletePending ? "Deleting..." : "Delete player"}
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {deleteState.error ? (
        <Alert aria-live="polite" className="mt-3" variant="destructive">
          <AlertDescription>{deleteState.error}</AlertDescription>
        </Alert>
      ) : null}
    </Card>
  );
}
