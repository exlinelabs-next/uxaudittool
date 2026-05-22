'use client';

import { useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
}

/**
 * Opens the Exline Labs Cal.com booking page in an iframe overlay.
 * Uses the same event type as exlinelabs.com (free-ux-audit-session).
 * No external JS embed script — just a plain iframe, works everywhere.
 */
export function BookingModal({ onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 900,
          height: 'min(90dvh, 700px)',
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #e5e5e5',
            background: '#fafafa',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#C8F135',
              }}
            />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
              Book a free discovery call
            </p>
            <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>
              with Exline Labs &middot; 30 min
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#666', padding: '4px', borderRadius: 4,
              display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Cal.com iframe */}
        <iframe
          src="https://cal.com/exlinelabs/free-ux-audit-session?embed=true&embedType=inline&theme=light"
          style={{ flex: 1, width: '100%', border: 'none' }}
          title="Book a free discovery call with Exline Labs"
          loading="lazy"
        />
      </div>
    </div>
  );
}
