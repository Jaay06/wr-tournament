import Link from "next/link";
import type { ReactNode } from "react";

import { RiftClashLogo } from "@/components/brand/rift-clash-logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-svh bg-background px-5 py-5 text-foreground max-tablet:px-4">
      <header className="mx-auto flex min-h-14 w-full max-w-page items-center justify-between gap-5 border-b border-border pb-5">
        <Link
          aria-label="Rift Clash home"
          className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted"
          href="/"
        >
          <RiftClashLogo className="h-11 w-auto" />
        </Link>
        <Badge className="h-auto rounded-full border-primary/25 bg-primary-soft px-3 py-1.5 font-mono text-2xs font-semibold tracking-[0.1em] text-primary-muted">
          {badgeLabel}
        </Badge>
      </header>

      <main className="mx-auto grid w-full max-w-page grid-cols-[minmax(0,1fr)_430px] items-center gap-16 py-14 max-desktop:grid-cols-[minmax(0,1fr)_390px] max-desktop:gap-9 max-tablet:grid-cols-1 max-tablet:gap-8 max-tablet:py-9">
        <section className="max-w-2xl">
          <p className="m-0 font-mono text-2xs font-semibold tracking-[0.14em] text-primary-muted">
            {eyebrow}
          </p>
          <h1 className="mt-4 mb-0 font-display text-[clamp(36px,5vw,58px)] font-bold leading-[1.02] tracking-[-0.05em] text-foreground">
            {title}
          </h1>
          <p className="mt-5 mb-0 max-w-copy text-lg leading-7 text-secondary-foreground max-phone:text-base max-phone:leading-6">
            {description}
          </p>
          <div className="mt-7 flex flex-wrap gap-2 font-mono text-2xs tracking-[0.08em] text-muted-foreground">
            <span className="rounded-full border border-border bg-card px-3 py-1.5">PRIVATE ACCESS</span>
            <span className="rounded-full border border-border bg-card px-3 py-1.5">ORGANIZER REVIEWED TIERS</span>
          </div>
        </section>

        <Card className="rounded-card border border-border bg-card p-5 shadow-2xl shadow-primary/10 tablet:p-6">
          {children}
        </Card>
      </main>
    </div>
  );
}
