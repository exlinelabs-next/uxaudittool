'use client';

import { useEffect, useState } from 'react';
import { useCookieConsent } from '@/lib/consent';

/**
 * GDPR/UK-GDPR compliant cookie consent banner.
 *
 * - Appears 600ms after first page load (only if no stored preference)
 * - Accepts OR declines - no dark patterns, no pre-ticked boxes
 * - Stores choice in localStorage
 * - GA only loads after 'accepted' (see GoogleAnalytics.tsx)
 */
export function CookieConsent() {
  const { consent, accept, decline } = useCookieConsent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consent === 'pending') {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [consent]);

  // Slide out smoothly when a choice is made
  const show = visible && consent === 'pending';

  return (
    <div
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '1rem',
        pointerEvents: show ? 'auto' : 'none',
        transform: show ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          borderRadius: 8,
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'var(--wb-surface)',
          border: '1px solid var(--wb-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
      >
        {/* Cookie icon */}
        <span style={{ fontSize: 20, flexShrink: 0 }}>🍪</span>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--wb-text)', margin: 0 }}>
            We use analytics cookies
          </p>
          <p style={{ fontSize: 12, color: 'var(--wb-muted)', margin: '2px 0 0' }}>
            Helps us understand usage, improve the tool, and make infrastructure decisions.
            No personal data is sold. &nbsp;
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--wb-accent)', textDecoration: 'underline' }}
            >
              Privacy policy
            </a>
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={decline}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid var(--wb-border)',
              color: 'var(--wb-muted)',
            }}
          >
            Decline
          </button>
          <button
            onClick={accept}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'var(--wb-accent)',
              border: 'none',
              color: '#000',
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Small "Cookie preferences" link to let users change their mind.
 * Drop this anywhere in a footer or settings area.
 */
export function CookiePreferencesLink() {
  const { reset } = useCookieConsent();
  return (
    <button
      onClick={reset}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 12,
        color: 'var(--wb-muted)',
        textDecoration: 'underline',
        padding: 0,
      }}
    >
      Cookie preferences
    </button>
  );
}
