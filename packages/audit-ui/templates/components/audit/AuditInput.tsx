'use client';

import { useState, type FormEvent } from 'react';
import type { AuditStatus } from '../lib/hooks/useAudit';

interface AuditInputProps {
  onSubmit: (url: string) => void;
  status: AuditStatus;
  error: string | null;
}

export function AuditInput({ onSubmit, status, error }: AuditInputProps) {
  const [value, setValue] = useState('');
  const isLoading = status === 'loading' || status === 'partial';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    let url = value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    onSubmit(url);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--wb-muted)' }}>🔒</span>
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="yourdomain.com"
            disabled={isLoading}
            autoComplete="url"
            spellCheck={false}
            className="w-full pl-9 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
            style={{ background: 'var(--wb-card)', border: '1px solid var(--wb-border)', color: 'var(--wb-text)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--wb-accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--wb-border)')}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="px-6 py-3.5 rounded-xl font-semibold text-sm shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--wb-accent)', color: '#000' }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" />
              </svg>
              Auditing...
            </span>
          ) : 'Audit my site'}
        </button>
      </div>
      {error && (
        <p className="text-sm px-4 py-2.5 rounded-lg" style={{ color: 'var(--wb-fail)', background: 'color-mix(in srgb, var(--wb-fail) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--wb-fail) 25%, transparent)' }}>
          {error}
        </p>
      )}
      {status === 'loading' && <p className="text-xs text-center animate-pulse" style={{ color: 'var(--wb-muted)' }}>Fetching your site and running checks...</p>}
      {status === 'partial' && <p className="text-xs text-center animate-pulse" style={{ color: 'var(--wb-muted)' }}>SEO, trust and UX results ready - loading performance data...</p>}
    </form>
  );
}
