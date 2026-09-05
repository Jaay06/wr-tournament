"use client";

import { useActionState, useRef, useState } from "react";
import { Check, Megaphone, Pencil, Send, Trash2, Users, X } from "lucide-react";
import type { TournamentAnnouncementData } from "@/lib/tournament-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement, type AnnouncementState } from "./actions";
import { cn } from "@/lib/utils";

const kicker = "font-mono text-2xs font-semibold uppercase tracking-[0.18em] text-muted-foreground";

function Feedback({ state }: { state: AnnouncementState }) {
  return <div aria-live="polite">{state.error && <p role="alert" className="m-0 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">{state.error}</p>}{state.success && <p className="m-0 rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-success">{state.success}</p>}</div>;
}

function Composer({ post, onDone }: { post: TournamentAnnouncementData | null; onDone: () => void }) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [state, action, pending] = useActionState<AnnouncementState, FormData>(async (previous, data) => {
    try {
      const result = await (post ? updateAnnouncement(previous, data) : createAnnouncement(previous, data));
      if (result.success) { setTitle(""); setBody(""); onDone(); }
      return result;
    } catch {
      return { error: "The update could not be saved. Your message is still here; try again." };
    }
  }, {});
  return <form action={action} className="grid gap-4 rounded-[14px] border border-border-strong bg-card p-5" id="announcement-form">
    <div className="flex items-start justify-between gap-3"><div><p className={cn(kicker, "m-0 text-primary")}>{post ? "Edit transmission" : "New transmission"}</p><h2 className="mt-2 mb-0 text-xl font-bold">{post ? "Update the room post." : "Write the room update."}</h2></div><Send size={19} className="mt-1 shrink-0 text-primary" /></div>
    {post && <input name="id" type="hidden" value={post.id} />}
    <label className="grid gap-2" htmlFor="announcement-title"><span className={kicker}>Title</span><Input id="announcement-title" name="title" className="h-11 rounded-lg bg-background px-3 text-sm" value={title} onChange={event => setTitle(event.target.value)} placeholder="Registration closes Sunday" minLength={2} maxLength={120} required disabled={pending} /></label>
    <label className="grid gap-2" htmlFor="announcement-body"><span className={kicker}>Message</span><Textarea id="announcement-body" name="body" className="min-h-36 resize-y rounded-lg bg-background px-3 py-3 text-sm leading-relaxed" value={body} onChange={event => setBody(event.target.value)} placeholder="Share the next thing players need to know..." minLength={2} maxLength={2000} required disabled={pending} /></label>
    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"><Users size={17} className="text-muted-foreground" /><div><p className="m-0 text-sm">All participants</p><p className="mt-1 mb-0 text-xs text-muted-foreground">Players, captains and organizers</p></div></div>
    <Feedback state={state} />
    <Button className="h-11 w-full gap-2 rounded-[10px] font-semibold" disabled={pending} type="submit">{pending ? "Saving..." : post ? "Save changes" : "Post announcement"}{post ? <Check size={16} /> : <Send size={16} />}</Button>
    {post && <Button className="h-11" variant="outline" onClick={onDone} disabled={pending} type="button"><X size={16} /> Cancel editing</Button>}
    <p className="m-0 text-xs leading-relaxed text-muted-foreground">Posts appear in every participant&apos;s feed. You can edit or delete them after publishing.</p>
  </form>;
}

function DeletePost({ post }: { post: TournamentAnnouncementData }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AnnouncementState, FormData>(async (previous, data) => {
    try {
      const result = await deleteAnnouncement(previous, data);
      if (result.success) setOpen(false);
      return result;
    } catch { return { error: "The announcement could not be deleted. Try again." }; }
  }, {});
  return <AlertDialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }}>
    <AlertDialogTrigger render={<Button size="icon" variant="outline" className="size-9 rounded-lg text-muted-foreground hover:text-danger" aria-label={"Delete " + post.title} />}><Trash2 size={15} /></AlertDialogTrigger>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this announcement?</AlertDialogTitle><AlertDialogDescription>This removes &quot;{post.title}&quot; from every participant&apos;s feed.</AlertDialogDescription></AlertDialogHeader><Feedback state={state} /><AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><form action={action}><input name="id" type="hidden" value={post.id} /><Button type="submit" variant="destructive" disabled={pending}>{pending ? "Deleting..." : "Delete announcement"}</Button></form></AlertDialogFooter></AlertDialogContent>
  </AlertDialog>;
}

export function AnnouncementManager({ announcements }: { announcements: TournamentAnnouncementData[] }) {
  const [editing, setEditing] = useState<TournamentAnnouncementData | null>(null);
  const composer = useRef<HTMLDivElement>(null);
  return <div className="grid items-start gap-[18px] desktop:grid-cols-[minmax(0,0.8fr)_minmax(0,1.3fr)]">
    <div ref={composer}><Composer key={editing?.id ?? "new"} post={editing} onDone={() => setEditing(null)} /></div>
    <section className="min-w-0 overflow-hidden rounded-[14px] border border-border bg-card" aria-label="Published announcements">
      <header className="flex items-center justify-between gap-3 border-b border-border p-[18px]"><div><p className={cn(kicker, "m-0")}>Published feed</p><h2 className="mt-1 mb-0 text-lg font-bold">What the room sees</h2></div><span className={kicker}>{announcements.length} posts</span></header>
      {announcements.length ? <div className="divide-y divide-border">{announcements.map((post, index) => <article className={cn("flex gap-3 p-[18px]", index === 0 && "border-l-2 border-primary bg-secondary")} key={post.id}>
        <span className={cn("mt-1 grid size-9 shrink-0 place-items-center rounded-lg", index === 0 ? "bg-primary-soft text-primary" : "bg-secondary text-muted-foreground")}><Megaphone size={17} /></span>
        <div className="min-w-0 flex-1"><h3 className="m-0 text-sm font-bold wrap-anywhere">{post.title}</h3><p className="my-2 text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere text-secondary-foreground">{post.body}</p><time dateTime={post.createdAt} className="font-mono text-2xs text-muted-foreground">{new Date(post.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC</time><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" className="h-9 gap-2 rounded-lg" onClick={() => { setEditing(post); composer.current?.scrollIntoView({ block: "start" }); requestAnimationFrame(() => document.getElementById("announcement-title")?.focus()); }} aria-label={"Edit " + post.title}><Pencil size={14} />Edit</Button><DeletePost post={post} /></div></div>
      </article>)}</div> : <div className="px-6 py-12 text-center"><Megaphone size={28} className="mx-auto text-muted-foreground" /><h3 className="mt-4 text-base font-semibold">No announcements yet.</h3><p className="text-sm text-muted-foreground">Your first post will appear here and in the participant feed.</p></div>}
    </section>
  </div>;
}
