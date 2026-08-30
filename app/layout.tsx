import type { Metadata, Viewport } from 'next';
import { Inter_Tight, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { getSiteUrl, siteConfig } from '@/lib/site';
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
  metadataBase: getSiteUrl(),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  category: 'gaming',
  manifest: '/manifest.webmanifest',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#070B18',
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
