import type {Metadata} from 'next';
import { Karla } from 'next/font/google';
import './globals.css';

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Marno AI — AI-Powered Customer Support',
  description: 'Intelligent AI chat for your business',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  const config = {
    webhookUrl: process.env.NEXT_PUBLIC_WEBHOOK_URL || "",
    kbSlug: process.env.NEXT_PUBLIC_KB_SLUG || "",
    brandName: process.env.NEXT_PUBLIC_BRAND_NAME || "",
    brandLogo: process.env.NEXT_PUBLIC_BRAND_LOGO || "",
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "",
    toggleIcon: process.env.NEXT_PUBLIC_TOGGLE_ICON || "",
    fontFamily: process.env.NEXT_PUBLIC_FONT_FAMILY || "",
  };
  const configJson = JSON.stringify(config);

  return (
    <html lang="en" className={karla.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://n8n.marno.pro" />
        <link rel="preconnect" href="https://marno-embed.vercel.app" />
        <link href="https://fonts.googleapis.com/css2?family=Rethink+Sans:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `window.MarnoChatConfig = ${configJson};` }} />
        <script src="https://marno-embed.vercel.app/marno-chat-widget.js" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}