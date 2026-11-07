import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/geist';
import './globals.css';
import { Providers } from '@/components/providers';
import { siteUrl } from '@/lib/site-url';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Nexora AI — A little less busy. A lot more possible.',
    template: '%s · Nexora AI',
  },
  description:
    'Bring your projects, tasks, notes, and AI into one thoughtfully connected workspace. Make room for your best work.',
  openGraph: {
    title: 'Nexora AI — Your work, connected.',
    description: 'A calmer workspace for ambitious ideas.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};
export const viewport: Viewport = { themeColor: '#09090f' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
