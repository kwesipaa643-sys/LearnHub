// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter, Lexend } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'LearnHub — Learn Anything', template: '%s | LearnHub' },
  description: 'World-class online learning platform with expert-led courses.',
  keywords: ['online learning', 'courses', 'e-learning', 'tutorials'],
  authors: [{ name: 'LearnHub' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'LearnHub' },
  openGraph: {
    type: 'website',
    siteName: 'LearnHub',
    title: 'LearnHub — Learn Anything',
    description: 'World-class online learning platform.',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ffffff' }, { media: '(prefers-color-scheme: dark)', color: '#0f172a' }],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lexend.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
