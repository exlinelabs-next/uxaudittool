import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Free Website UX Audit - Webbeet',
  description:
    'Get an instant, free UX audit of your website. Scored across performance, SEO, trust, mobile, accessibility and UX signals in seconds.',
  openGraph: {
    title: 'Free Website UX Audit - Webbeet',
    description: 'Find out exactly what is holding your website back - free instant audit.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
