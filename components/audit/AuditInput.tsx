'use client';

import { useState, type FormEvent } from 'react';
import type { AuditStatus } from '@/lib/hooks/useAudit';

interface AuditInputProps {
  onSubmit: (url: string) => void;
  onReset?: () => void;
  status: AuditStatus;
  error: string | null;
  currentUrl?: string;
}

export function AuditInput({ onSubmit, onReset, status, error, currentUrl }: AuditInputProps) {
  const [value, setValue] = useState('');
  const isRunning = status === 'loading' || status === 'partial';
  const hasResult = status === 'partial' || status === 'complete';

  const isLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?/.test(value.trim());

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || isRunning) return;
    let url = value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = (isLocalhost ? 'http://' : 'https://') + url;
    }
    onSubmit(url);
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center rounded overflow-hidden"
          style={{
            border: '1px solid var(--wb-border)',
            background: 'var(--wb-surface)',
          }}
        >
          {/* Protocol prefix */}
          <span
            className="px-3 py-2.5 font-mono shrink-0 select-none"
            style={{
              fontSize: 13,
              color: 'var(--wb-muted)',
              borderRight: '1px solid var(--wb-border)',
              background: 'var(--wb-surface-2)',
            }}
          >
            {isLocalhost ? 'http://' : 'https://'}
          </span>

          {/* Input */}
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={currentUrl ? currentUrl.replace(/^https?:\/\//, '') : 'yourdomain.com'}
            disabled={isRunning}
            autoComplete="url"
            spellCheck={false}
            className="flex-1 px-3 py-2.5 outline-none bg-transparent disabled:opacity-50"
            style={{ fontSize: 14, color: 'var(--wb-text)' }}
          />

          {/* Status text while running */}
          {isRunning && (
            <span className="px-3 animate-pulse shrink-0" style={{ fontSize: 12, color: 'var(--wb-muted)' }}>
              {status === 'loading' ? 'Scanning...' : 'Loading performance...'}
            </span>
          )}

          {/* Run button */}
          <button
            type="submit"
            disabled={isRunning || !value.trim()}
            className="px-4 py-2.5 shrink-0 transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontSize: 13, fontWeight: 600, background: 'var(--wb-accent)', color: '#000' }}
          >
            {isRunning ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" />
              </svg>
            ) : 'Run audit'}
          </button>

          {/* Reset button - only when results exist */}
          {hasResult && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-2.5 text-xs transition-opacity hover:opacity-80"
              style={{ color: 'var(--wb-muted)', borderLeft: '1px solid var(--wb-border)' }}
              title="Clear results"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded text-xs"
          style={{
            color: 'var(--wb-critical)',
            background: 'color-mix(in srgb, var(--wb-critical) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--wb-critical) 20%, transparent)',
          }}
        >
          <span>⚠</span>
          {error}
        </div>
      )}
    </div>
  );
}
