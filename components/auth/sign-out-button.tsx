import { signOut } from "@/auth";

export function SignOutButton() {
  async function signOutAction() {
    "use server";

    await signOut({ redirectTo: "/" });
  }

  return (
    <form action={signOutAction}>
      <button
        className="inline-flex min-h-9 items-center justify-center rounded-full border border-border bg-secondary px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
