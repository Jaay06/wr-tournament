import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export function DiscordSignInButton({ callbackUrl }: { callbackUrl: string }) {
  async function signInWithDiscord() {
    "use server";

    await signIn("discord", { redirectTo: callbackUrl });
  }

  return (
    <form action={signInWithDiscord}>
      <Button className="min-h-12 w-full gap-2.5 rounded-xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover" size="lg" type="submit">
        <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
          <path
            d="M19.54 4.27A16.2 16.2 0 0 0 15.5 3l-.5 1.02a14.8 14.8 0 0 0-6 0L8.5 3a16.2 16.2 0 0 0-4.04 1.27C1.9 8.18 1.2 12 1.54 15.77a16.2 16.2 0 0 0 4.96 2.5l1.2-1.65a10 10 0 0 1-1.9-.92l.47-.36a11.5 11.5 0 0 0 10.46 0l.47.36c-.61.36-1.25.67-1.9.92l1.2 1.65a16.2 16.2 0 0 0 4.96-2.5c.4-4.37-.69-8.15-1.92-11.5ZM8.5 14.1c-1.03 0-1.88-.94-1.88-2.1s.83-2.1 1.88-2.1 1.88.94 1.88 2.1-.85 2.1-1.88 2.1Zm7 0c-1.03 0-1.88-.94-1.88-2.1s.83-2.1 1.88-2.1 1.88.94 1.88 2.1-.85 2.1-1.88 2.1Z"
            fill="currentColor"
          />
        </svg>
        Continue with Discord
      </Button>
    </form>
  );
}
