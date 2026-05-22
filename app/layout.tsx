import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { CookieConsent, CookiePreferencesLink } from '@/components/CookieConsent';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ux-audit.exlinelabs.com';

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
                url: 'https://exlinelabs.com',
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
          <span style={{ fontSize: 12, color: 'var(--wb-muted)' }}>
            Powered by{' '}
            <a href="https://exlinelabs.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--wb-muted)', textDecoration: 'none', fontWeight: 600 }}>Exline Labs</a>
            {' '}&mdash; &copy; {new Date().getFullYear()}. Free to use.
          </span>
          <nav aria-label="Footer navigation" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="mailto:info@exlinelabs.com" style={{ fontSize: 12, color: 'var(--wb-muted)', textDecoration: 'none' }}>
              info@exlinelabs.com
            </a>
            <a href="/privacy" style={{ fontSize: 12, color: 'var(--wb-muted)', textDecoration: 'none' }}>
              Privacy Policy
            </a>
            <a href="/terms" style={{ fontSize: 12, color: 'var(--wb-muted)', textDecoration: 'none' }}>
              Terms
            </a>
            <a href="https://www.linkedin.com/company/exlinelabs/posts/?feedView=all" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--wb-muted)', textDecoration: 'none' }}>
              LinkedIn
            </a>
            <a href="https://github.com/Exline-Labs" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--wb-muted)', textDecoration: 'none' }}>
              GitHub
            </a>
            <CookiePreferencesLink />
          </nav>
        </footer>

        {/* Cal.com embed - powers "Book a free discovery call" button */}
        <Script id="cal-embed" strategy="lazyOnload">{`
          (function(C,A,L){let p=function(a,ar){a.q.push(ar);};let d=C.document;C.Cal=C.Cal||function(){let cal=C.Cal;let ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];d.head.appendChild(d.createElement("script")).src=A;cal.loaded=true;}if(ar[0]===L){const api=function(){p(api,arguments);};const namespace=ar[1];api.q=[];if(typeof namespace==="string"){cal.ns[namespace]=cal.ns[namespace]||api;p(cal.ns[namespace],ar);p(cal,["initNamespace",namespace]);}else p(cal,ar);return;}p(cal,ar);};})(window,"https://app.cal.com/embed/embed.js","init");
          Cal("init","free-ux-audit-session",{origin:"https://app.cal.com"});
          Cal.ns["free-ux-audit-session"]("ui",{"hideEventTypeDetails":false,"layout":"month_view"});
        `}</Script>

        {/* GA4 - only renders after consent accepted */}
        <GoogleAnalytics />

        {/* Cookie consent banner - slides up on first visit */}
        <CookieConsent />
      </body>
    </html>
  );
}
