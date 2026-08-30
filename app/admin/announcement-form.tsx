"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { TournamentAnnouncementData } from "@/lib/tournament-types";

import {
  createAnnouncement,
  deleteAnnouncement,
  type AnnouncementState,
} from "./actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : children}
    </button>
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
    <section className="rounded-2xl border border-border bg-card p-5" id="announcement-form">
      <div className="mb-6">
        <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">ANNOUNCEMENTS</p>
        <h2 className="mt-2 mb-0 font-display text-xl font-bold">Keep everyone in the loop</h2>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="announcement-title">
          Title
          <input className="min-h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20" id="announcement-title" name="title" placeholder="Registration closes Sunday" required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="announcement-body">
          Message
          <textarea className="min-h-28 rounded-xl border border-border bg-background px-3.5 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20" id="announcement-body" name="body" placeholder="Submit your roster before the deadline." required />
        </label>
        {state.error ? <p aria-live="polite" className="m-0 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-danger">{state.error}</p> : null}
        {state.success ? <p aria-live="polite" className="m-0 rounded-xl border border-success/30 bg-success-soft px-3.5 py-3 text-sm text-success">{state.success}</p> : null}
        <SubmitButton>Post announcement</SubmitButton>
      </form>

      <div className="mt-7 border-t border-border pt-5">
        <p className="m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">POSTED</p>
        {announcements.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No announcements yet.</p> : <div className="mt-3 flex flex-col gap-3">{announcements.map((announcement) => <article className="rounded-xl border border-border bg-secondary p-4" key={announcement.id}><div className="flex items-start justify-between gap-4"><div><h3 className="m-0 text-sm font-semibold">{announcement.title}</h3><p className="mt-2 text-sm leading-5 text-secondary-foreground">{announcement.body}</p><p className="mt-3 font-mono text-2xs text-muted-foreground">{new Date(announcement.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}</p></div><form action={deleteAction}><input name="id" type="hidden" value={announcement.id} /><button className="min-h-9 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-danger/40 hover:text-danger" type="submit">Delete</button></form></div></article>)}</div>}
        {deleteState.error ? <p aria-live="polite" className="mt-3 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-danger">{deleteState.error}</p> : null}
        {deleteState.success ? <p aria-live="polite" className="mt-3 rounded-xl border border-success/30 bg-success-soft px-3.5 py-3 text-sm text-success">{deleteState.success}</p> : null}
      </div>
    </section>
  );
}
