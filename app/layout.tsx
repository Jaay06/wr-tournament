import type { Metadata } from 'next';
import {
  Inter_Tight,
  JetBrains_Mono,
  Space_Grotesk,
} from 'next/font/google';
import './globals.css';

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
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
      className={`${interTight.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} font-sans`}
    >
      <body>{children}</body>
    </html>
  );
}
