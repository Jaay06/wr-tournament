import Link from "next/link";
import type { ReactNode } from "react";
import { Check, KeyRound, UserRoundCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { RiftClashMark } from "@/components/brand/rift-clash-logo";

const accessSteps: {
  icon: LucideIcon;
  label: string;
  detail: string;
}[] = [
  {
    icon: KeyRound,
    label: "Authenticate",
    detail: "Use Discord or your email account.",
  },
  {
    icon: Check,
    label: "Enter the private invite",
    detail: "Use the current code from the organizer.",
  },
  {
    icon: UserRoundCheck,
    label: "Complete your profile",
    detail: "Add your Riot ID, rank, tier, and roles.",
  },
];

export function EntryShell({
  eyebrow,
  title,
  description,
  badgeLabel = "PRIVATE INVITE",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  badgeLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="entry-shell min-h-[100dvh] bg-background text-foreground">
      <main className="mx-auto grid min-h-[100dvh] w-full max-w-[1440px] tablet:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <section className="flex min-h-[100dvh] flex-col px-5 py-6 phone:px-8 tablet:px-[clamp(40px,6vw,84px)] tablet:py-9">
          <Link
            aria-label="Rift Clash home"
            className="flex w-fit items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted"
            href="/"
          >
            <RiftClashMark className="size-7" /><span><span className="block text-sm font-bold">RIFT CLASH</span><span className="block font-mono text-[8px] tracking-[0.15em] text-muted-foreground">PRIVATE WILD RIFT</span></span>
          </Link>

          <div className="my-auto w-full max-w-[470px] py-10">
            <p className="m-0 font-mono text-2xs font-semibold tracking-[0.18em] text-primary-muted">
              {eyebrow}
            </p>
            <h1 className="mt-3 mb-0 text-balance font-display text-[clamp(30px,3vw,40px)] font-bold leading-[1.1] tracking-[-0.035em]">
              {title}
            </h1>
            <p className="mt-3 mb-0 max-w-copy text-base leading-6 text-secondary-foreground">
              {description}
            </p>
            <div className="mt-6">
              {children}
            </div>
          </div>

          <p className="m-0 font-mono text-3xs tracking-[0.08em] text-muted-foreground">
            {badgeLabel}
          </p>
        </section>

        <aside className="hidden border-l border-border bg-card px-[clamp(42px,6vw,78px)] py-10 tablet:flex tablet:flex-col tablet:justify-center">
          <div className="max-w-[480px]">
            <p className="m-0 font-mono text-2xs font-semibold tracking-[0.18em] text-success">
              PRIVATE BY DESIGN
            </p>
            <h2 className="mt-4 mb-0 text-balance font-display text-[clamp(28px,3vw,40px)] font-bold leading-[1.1] tracking-[-0.035em]">
              The account opens the door. The invite opens the room.
            </h2>
            <p className="mt-4 mb-0 max-w-copy text-base leading-6 text-secondary-foreground">
              Authentication and tournament access stay separate, so organizers control who joins.
            </p>

            <ol className="mt-8 flex list-none flex-col gap-3 p-0">
              {accessSteps.map(({ detail, icon: Icon, label }, index) => (
                <li className="flex items-center gap-4 rounded-xl border border-border bg-background/35 p-4" key={label}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-secondary font-mono text-xs font-bold text-primary-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon aria-hidden="true" className="text-primary-muted" size={16} />
                      {label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}
