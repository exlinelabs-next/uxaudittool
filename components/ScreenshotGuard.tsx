'use client';

import { useScreenshotPrevention } from '@/lib/hooks/useScreenshotPrevention';

/**
 * Wraps its children with screenshot protection.
 *
 * When a screenshot shortcut or screen-capture API call is detected:
 * - An opaque overlay replaces the content for ~2.5 seconds
 * - @media print (Ctrl+P, browser print-to-PDF) is blocked site-wide via CSS in globals
 *
 * Note: this cannot stop OS-level screenshots taken by third-party tools,
 * but it covers the most common keyboard shortcuts and browser screen capture.
 */
export function ScreenshotGuard({ children }: { children: React.ReactNode }) {
  const { isBlocked } = useScreenshotPrevention();

  return (
    <div style={{ position: 'relative' }}>
      {children}

      {/* Blocking overlay - shown on screenshot attempt */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          // Fade in/out smoothly
          opacity: isBlocked ? 1 : 0,
          pointerEvents: isBlocked ? 'all' : 'none',
          transition: 'opacity 0.15s ease',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p style={{ color: '#555', fontSize: 13, fontWeight: 600, margin: 0 }}>
          Screenshots are disabled
        </p>
        <p style={{ color: '#333', fontSize: 11, margin: 0 }}>
          Use the email button to get a copy of this report.
        </p>
      </div>
    </div>
  );
}
