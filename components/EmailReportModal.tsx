'use client';

import { useState, useEffect, useRef } from 'react';
import type { AuditCategories } from '@/lib/audit/types';

interface Props {
  format: 'md' | 'pdf';
  url: string;
  overallScore: number;
  categories: Partial<AuditCategories>;
  scannedAt?: string;
  onClose: () => void;
}

export function EmailReportModal({ format, url, overallScore, categories, scannedAt, onClose }: Props) {
  const [email, setEmail]   = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open, close on Escape
  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, format, url, overallScore, categories, scannedAt }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Server error ${res.status}`);
      }
      setStatus('sent');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  const formatLabel = format === 'md' ? 'Markdown (.md)' : 'PDF Report (.pdf)';
  const formatIcon  = format === 'md' ? '.md' : 'PDF';

  return (
    /* Backdrop */
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Panel */}
      <div
        style={{
          width: '100%', maxWidth: 440,
          background: 'var(--wb-surface)',
          border: '1px solid var(--wb-border)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--wb-border)',
            background: 'var(--wb-surface-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 6,
                background: 'color-mix(in srgb, var(--wb-accent) 15%, transparent)',
                color: 'var(--wb-accent)', fontSize: 11, fontWeight: 700,
              }}
            >
              {formatIcon}
            </span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--wb-text)', lineHeight: 1.2 }}>
                Email your report
              </p>
              <p style={{ fontSize: 11, color: 'var(--wb-muted)', marginTop: 1 }}>
                {formatLabel} will be sent to your inbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--wb-muted)', padding: 4, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 18px' }}>
          {status === 'sent' ? (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: '50%', margin: '0 auto 14px',
                  background: 'color-mix(in srgb, var(--wb-pass) 15%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M5 11l4 4 8-8" stroke="var(--wb-pass)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--wb-text)', marginBottom: 6 }}>
                Report sent!
              </p>
              <p style={{ fontSize: 13, color: 'var(--wb-muted)', marginBottom: 20 }}>
                Check your inbox at <strong style={{ color: 'var(--wb-text)' }}>{email}</strong>.<br/>
                It may take a minute or two to arrive.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: 'var(--wb-accent)', border: 'none', color: 'var(--wb-accent-fg)',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Audited URL context */}
              <div
                style={{
                  padding: '8px 12px', borderRadius: 6, marginBottom: 16,
                  background: 'var(--wb-surface-2)', border: '1px solid var(--wb-border)',
                  fontSize: 12, color: 'var(--wb-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--wb-muted)' }}>Audit for: </span>
                <span style={{ fontWeight: 600, color: 'var(--wb-text)' }}>{url}</span>
              </div>

              {/* Email input */}
              <label
                htmlFor="email-report-input"
                style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--wb-muted)', marginBottom: 6 }}
              >
                Your email address
              </label>
              <input
                id="email-report-input"
                ref={inputRef}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6, fontSize: 13,
                  background: 'var(--wb-bg)', color: 'var(--wb-text)',
                  border: `1px solid ${errorMsg ? 'var(--wb-critical)' : 'var(--wb-border)'}`,
                  outline: 'none', marginBottom: errorMsg ? 6 : 16,
                  transition: 'border-color 0.15s',
                }}
                autoComplete="email"
                disabled={status === 'sending'}
              />
              {errorMsg && (
                <p style={{ fontSize: 11, color: 'var(--wb-critical)', marginBottom: 14 }}>{errorMsg}</p>
              )}

              {/* Privacy note */}
              <p style={{ fontSize: 12, color: 'var(--wb-text)', opacity: 0.6, marginBottom: 16, lineHeight: 1.6 }}>
                We will send your report to this address. We never share your email or send marketing without permission.
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={onClose}
                  disabled={status === 'sending'}
                  style={{
                    padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: 'transparent', border: '1px solid var(--wb-border)', color: 'var(--wb-muted)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={status === 'sending' || !email.trim()}
                  style={{
                    padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    background: status === 'sending' ? 'var(--wb-dim)' : 'var(--wb-accent)',
                    border: 'none',
                    color: status === 'sending' ? 'var(--wb-muted)' : 'var(--wb-accent-fg)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: (!email.trim() && status !== 'sending') ? 0.5 : 1,
                    transition: 'opacity 0.15s, background 0.15s',
                  }}
                >
                  {status === 'sending' ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 8" strokeLinecap="round"/>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Send report
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
