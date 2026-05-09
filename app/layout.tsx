import type {Metadata} from 'next';
import { Karla } from 'next/font/google';
import './globals.css';

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Marno AI Chat Widget',
  description: 'AI-powered chat widget for intelligent support',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={karla.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Rethink+Sans:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}