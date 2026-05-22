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
      {/* Modal shell — no header, just the iframe */}
      <div
        style={{
          position: 'relative',
          width: '100%', maxWidth: 900,
          height: 'min(90dvh, 700px)',
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Cal.com iframe — extra height so the Cal.com footer strip is pushed out of view */}
        <iframe
          src="https://cal.com/exlinelabs/free-ux-audit-session?embed=true&embedType=inline&theme=light"
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%',
            /* ~52 px taller than the container hides the Cal.com branding row at the bottom */
            height: 'calc(100% + 52px)',
            border: 'none',
          }}
          title="Book a free discovery call with Exline Labs"
          loading="lazy"
        />

        {/* Floating close button — top-right corner, above the iframe */}
        <button
          onClick={onClose}
          aria-label="Close booking modal"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer',
            color: '#fff', backdropFilter: 'blur(4px)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
