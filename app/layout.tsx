import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { CookieConsent, CookiePreferencesLink } from '@/components/CookieConsent';

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme - runs synchronously before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wb-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);return;}var q=window.matchMedia('(prefers-color-scheme: light)');document.documentElement.setAttribute('data-theme',q.matches?'light':'dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}

        {/* Minimal footer - cookie preferences */}
        <footer
          style={{
            borderTop: '1px solid var(--wb-border)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--wb-dim)' }}>
            &copy; {new Date().getFullYear()} Webbeet. Free to use.
          </span>
          <CookiePreferencesLink />
        </footer>

        {/* GA4 - only renders after consent accepted */}
        <GoogleAnalytics />

        {/* Cookie consent banner - slides up on first visit */}
        <CookieConsent />
      </body>
    </html>
  );
}
