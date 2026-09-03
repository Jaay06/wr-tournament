import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false, noarchive: true },
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}

