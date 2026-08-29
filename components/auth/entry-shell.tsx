import Link from "next/link";
import type { ReactNode } from "react";

export function EntryShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background px-5 py-6 text-foreground max-tablet:px-4 max-tablet:py-4">
      <header className="mx-auto flex w-full max-w-page items-center justify-between gap-5 border-b border-border pb-5">
        <Link
          className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted"
          href="/"
        >
          <span className="grid size-9 place-items-center rounded-md bg-primary text-sm font-extrabold text-primary-foreground">
            WR
          </span>
          <span className="flex flex-col">
            <strong className="text-base font-bold leading-4.5 tracking-[-0.02em]">
              RIFT CLASH
            </strong>
            <small className="font-mono text-3xs leading-3.25 tracking-[0.12em] text-muted-foreground max-phone:hidden">
              PRIVATE WILD RIFT TOURNAMENT
            </small>
          </span>
        </Link>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-2xs font-semibold tracking-widest text-muted-foreground">
          FRIENDS ONLY
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-page grid-cols-[minmax(0,1fr)_420px] items-center gap-16 py-16 max-desktop:grid-cols-[minmax(0,1fr)_380px] max-desktop:gap-9 max-tablet:grid-cols-1 max-tablet:gap-8 max-tablet:py-10">
        <section className="max-w-copy">
          <p className="m-0 font-mono text-xs font-semibold tracking-[0.13em] text-success">
            {eyebrow}
          </p>
          <h1 className="mt-5.5 mb-0 font-display text-3xl font-extrabold leading-[0.98] tracking-[-0.055em] text-primary max-phone:text-2xl">
            {title}
          </h1>
          <p className="mt-5.5 mb-0 text-lg leading-[1.6] text-secondary-foreground max-phone:text-base">
            {description}
          </p>
        </section>

        <section className="rounded-card border border-border bg-card p-5.5 shadow-2xl shadow-background/40">
          {children}
        </section>
      </main>
    </div>
  );
}
