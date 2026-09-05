type RoomLoadingProps = {
  organizer?: boolean;
};

export function RoomLoading({ organizer = false }: RoomLoadingProps) {
  const label = organizer
    ? "Loading organizer control room"
    : "Loading tournament room";

  return (
    <main
      aria-label={label}
      aria-live="polite"
      className="min-h-[100dvh] bg-background p-5 text-foreground max-phone:p-4"
      role="status"
    >
      <span className="sr-only">{label}…</span>
      <div className="mx-auto grid w-full max-w-page gap-5">
        <div className="h-16 rounded-xl border border-border bg-card" />
        <div className="grid gap-5 desktop:grid-cols-[244px_minmax(0,1fr)]">
          <div className="hidden min-h-[32rem] rounded-xl bg-shell-sidebar desktop:block" />
          <div className="grid content-start gap-4">
            <div className="h-32 rounded-xl border border-border bg-card" />
            <div className="grid gap-4 tablet:grid-cols-2">
              <div className="h-52 rounded-xl border border-border bg-card" />
              <div className="h-52 rounded-xl border border-border bg-card" />
            </div>
            <div className="h-40 rounded-xl border border-border bg-card" />
          </div>
        </div>
      </div>
    </main>
  );
}
