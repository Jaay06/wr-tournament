import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tournament room",
  robots: { index: false, follow: false, noarchive: true },
};

export default function TournamentLayout({ children }: { children: ReactNode }) {
  return children;
}
