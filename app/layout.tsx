import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Poppins, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Rift Clash | Private Wild Rift tournament',
  description: 'A private place for friends to register, approve tiers, and form Wild Rift tournament teams.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='en'
      className={cn(inter.variable, poppins.variable, jetBrainsMono.variable, "font-sans", geist.variable)}
    >
      <body>{children}</body>
    </html>
  );
}
