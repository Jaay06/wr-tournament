import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Tournament room",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function TournamentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Ftournament");
  }

  return children;
}
