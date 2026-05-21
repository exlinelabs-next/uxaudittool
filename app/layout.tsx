import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { CookieConsent, CookiePreferencesLink } from '@/components/CookieConsent';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ux-audit.exlinelabs.co.uk';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Free Website UX Audit Tool - Webbeet',
  description:
    'Get an instant, free UX audit of your website. Scored across 51 checks in 6 categories: performance, SEO, trust, mobile, accessibility and UX signals. Results in seconds.',
  keywords: ['website audit', 'UX audit', 'SEO audit', 'free website checker', 'website performance', 'accessibility checker', 'Webbeet'],
  authors: [{ name: 'Webbeet', url: BASE_URL }],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'Free Website UX Audit Tool - Webbeet',
    description: 'Find out exactly what is holding your website back. 51 checks across SEO, performance, trust, mobile, accessibility and UX - free and instant.',
    type: 'website',
    url: BASE_URL,
    siteName: 'Webbeet UX Audit',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Webbeet - Free Website UX Audit Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Website UX Audit Tool - Webbeet',
    description: 'Find out exactly what is holding your website back. 51 checks - free and instant.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme - runs synchronously before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wb-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);return;}document.documentElement.setAttribute('data-theme','dark');}catch(e){}})()`,
          }}
        />
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Webbeet UX Audit',
              url: BASE_URL,
              description: 'Free instant website UX audit covering 51 checks across SEO, performance, trust, mobile, accessibility and UX signals.',
              applicationCategory: 'WebApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'GBP',
              },
              provider: {
                '@type': 'Organization',
                name: 'Exline Labs',
                url: 'https://exlinelabs.co.uk',
                email: 'info@exlinelabs.com',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}

        {/* Footer */}
        <footer
          data-cookie-link
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
            Powered by{' '}
            <a href="https://exlinelabs.co.uk" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--wb-muted)', textDecoration: 'none', fontWeight: 600 }}>Exline Labs</a>
            {' '}&mdash; &copy; {new Date().getFullYear()}. Free to use.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="mailto:info@exlinelabs.com" style={{ fontSize: 12, color: 'var(--wb-dim)', textDecoration: 'none' }}>
              info@exlinelabs.com
            </a>
            <a href="/privacy" style={{ fontSize: 12, color: 'var(--wb-dim)', textDecoration: 'none' }}>
              Privacy Policy
            </a>
            <a href="https://linkedin.com/company/exline-labs" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--wb-dim)', textDecoration: 'none' }}>
              LinkedIn
            </a>
            <CookiePreferencesLink />
          </div>
        </footer>

        {/* GA4 - only renders after consent accepted */}
        <GoogleAnalytics />

        {/* Cookie consent banner - slides up on first visit */}
        <CookieConsent />
      </body>
    </html>
  );
}
