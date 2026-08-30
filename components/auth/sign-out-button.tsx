import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  async function signOutAction() {
    "use server";

    await signOut({ redirectTo: "/" });
  }

  return (
    <form action={signOutAction}>
      <Button className="min-h-11 rounded-full border border-border bg-secondary px-3.5 py-2 text-sm font-semibold text-foreground hover:border-border-strong hover:bg-secondary/80" size="lg" type="submit">
        Sign out
      </Button>
    </form>
  );
}
