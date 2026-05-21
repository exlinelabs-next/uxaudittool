'use client';

import Script from 'next/script';
import { useCookieConsent } from '@/lib/consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Loads GA4 only after explicit user consent.
 * Renders nothing if no GA_ID is configured or consent is not accepted.
 */
export function GoogleAnalytics() {
  const { consent } = useCookieConsent();

  if (!GA_ID || consent !== 'accepted') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure',
          });
        `}
      </Script>
    </>
  );
}
