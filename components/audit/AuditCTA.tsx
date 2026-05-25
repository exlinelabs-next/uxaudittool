'use client';

import { useState } from 'react';
import { BookingModal } from '@/components/BookingModal';

export function AuditCTA({
  label = 'Book a free discovery call',
}: {
  href?: string;  // kept for API compat, booking modal takes precedence
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 rounded"
        style={{ border: '1px solid var(--wb-border)', background: 'var(--wb-surface)' }}
      >
        <div>
          <p className="font-medium" style={{ fontSize: 15, color: 'var(--wb-text)' }}>
            Want us to fix these issues?
          </p>
          <p className="mt-1" style={{ fontSize: 13, color: 'var(--wb-muted)' }}>
            We will walk through your results and build a prioritised action plan.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-semibold shrink-0 transition-opacity hover:opacity-90"
          style={{ fontSize: 14, background: 'var(--wb-accent)', color: 'var(--wb-accent-fg)', border: 'none', cursor: 'pointer' }}
        >
          {label}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && <BookingModal onClose={() => setOpen(false)} />}
    </>
  );
}
