'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudit } from '@/lib/hooks/useAudit';
import { AuditInput } from '@/components/audit/AuditInput';
import { AuditReport } from '@/components/audit/AuditReport';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BookingModal } from '@/components/BookingModal';
import { trackAuditStarted, trackAuditCompleted, trackAuditErrored } from '@/lib/analytics';

/* ── Corner bracket decoration ───────────────────────────────────────────── */
function CornerBracket({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const t = pos[0] === 't', l = pos[1] === 'l';
  const s = 'var(--wb-accent)';
  return (
    <svg
      width={20} height={20} viewBox="0 0 20 20" fill="none"
      style={{
        position: 'absolute',
        top: t ? 0 : 'auto', bottom: t ? 'auto' : 0,
        left: l ? 0 : 'auto', right: l ? 'auto' : 0,
        opacity: 0.65,
      }}
    >
      {t && l  && <path d="M1 11V1H11"  stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {t && !l && <path d="M19 11V1H9"  stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {!t && l  && <path d="M1 9V19H11" stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {!t && !l && <path d="M19 9V19H9" stroke={s} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/* ── Category data ───────────────────────────────────────────────────────── */
const CATEGORIES = [
  { cat: 'SEO',           checks: 13, desc: 'Title, meta, headings, Open Graph, structured data' },
  { cat: 'Trust',         checks: 7,  desc: 'HTTPS, privacy policy, contact info, social proof'  },
  { cat: 'UX Signals',    checks: 9,  desc: 'CTAs, navigation clarity, forms, live chat'         },
  { cat: 'Performance',   checks: 8,  desc: 'Core Web Vitals, LCP, CLS, page weight'             },
  { cat: 'Mobile',        checks: 6,  desc: 'Viewport, tap targets, font legibility'              },
  { cat: 'Accessibility', checks: 8,  desc: 'axe-core WCAG scan, ARIA, contrast'                 },
];

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { state, runAudit, retryCategory, reset } = useAudit();
  const startedAt = useRef<number>(0);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Drive every animation from this single boolean
  const active = state.status !== 'idle';

  // Track audit lifecycle events
  useEffect(() => {
    if (state.status === 'running') {
      startedAt.current = Date.now();
      trackAuditStarted(state.url);
    } else if (state.status === 'complete') {
      trackAuditCompleted(state.overallScore, Date.now() - startedAt.current);
    } else if (state.status === 'error') {
      trackAuditErrored(state.error ?? 'unknown');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // Shared easing
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--wb-bg)' }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20"
        style={{ background: 'var(--wb-bg)', borderBottom: '1px solid var(--wb-border)' }}
      >
        <div
          className="w-full px-4 sm:px-8 lg:px-[70px] flex items-center gap-3"
          style={{ height: 56 }}
        >
          {/* Logo / primary nav */}
          <nav aria-label="Main navigation">
            <a
              href="/"
              style={{ color: 'var(--wb-text)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0 }}
            >
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>
                web<span style={{ color: 'var(--wb-accent)' }}>beet</span>
              </span>
              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: 'var(--wb-muted)' }}>
                UX Audit
              </span>
            </a>
          </nav>

          {/*
           * Middle slot - stats and input occupy the same space.
           * Both are position:absolute inside so they can cross-fade
           * without affecting layout. The slot itself stays flex:1.
           */}
          <div className="flex-1" style={{ position: 'relative', height: '100%' }}>

            {/* Stats - visible when idle, exits upward */}
            <div
              className="absolute inset-0 flex items-center justify-end"
              style={{
                gap: 20,
                opacity: active ? 0 : 1,
                transform: active ? 'translateY(-8px)' : 'translateY(0)',
                transition: `opacity 0.22s ${ease}, transform 0.22s ${ease}`,
                pointerEvents: active ? 'none' : 'auto',
              }}
            >
              <div className="hidden sm:flex items-center gap-5">
                {[{ v: '51', l: 'checks' }, { v: '6', l: 'categories' }].map(({ v, l }) => (
                  <div key={l} className="flex items-baseline gap-1">
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--wb-accent)' }}>{v}</span>
                    <span style={{ fontSize: 13, color: 'var(--wb-muted)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/*
             * URL input - hidden when idle, slides in from below when active.
             * Delay matches the hero input exit so it feels like the same
             * element arrived here (morph illusion).
             */}
            <div
              className="absolute inset-0 flex items-center"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? 'translateY(0)' : 'translateY(10px)',
                transition: active
                  ? `opacity 0.3s 0.18s ${ease}, transform 0.3s 0.18s ${ease}`
                  : `opacity 0.15s ${ease}, transform 0.15s ${ease}`,
                pointerEvents: active ? 'auto' : 'none',
              }}
            >
              <div style={{ width: '100%' }}>
                <AuditInput
                  onSubmit={runAudit}
                  onReset={reset}
                  status={state.status}
                  error={null}
                  currentUrl={state.url}
                />
              </div>
            </div>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* ── HERO - collapses via grid-template-rows ──────────────────────── */}
      {/*
       * grid-template-rows: 1fr → 0fr smoothly animates the row height to 0.
       * The inner div has overflow:hidden so content clips cleanly.
       * Content itself fades + translates up simultaneously so it's invisible
       * before the clip reaches it - no jarring cut.
       */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: active ? '0fr' : '1fr',
          transition: `grid-template-rows 0.5s ${ease}`,
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              opacity: active ? 0 : 1,
              transform: active ? 'translateY(-24px) scale(0.98)' : 'translateY(0) scale(1)',
              transition: `opacity 0.25s ${ease}, transform 0.28s ${ease}`,
            }}
          >
            {/* Hero */}
            <section className="flex flex-col items-center justify-center px-4 sm:px-8 lg:px-[70px] pt-12 sm:pt-20 pb-8 sm:pb-12 text-center">

              {/* Eyebrow pill */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6"
                style={{
                  fontSize: 12, fontWeight: 500,
                  border: '1px solid color-mix(in srgb, var(--wb-accent) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--wb-accent) 6%, transparent)',
                  color: 'var(--wb-accent)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--wb-accent)', display: 'inline-block' }} />
                Free &middot; No signup &middot; Instant results
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: 'var(--wb-text)',
                  maxWidth: 860,
                  marginBottom: '1.25rem',
                }}
              >
                Is your website{' '}
                <span style={{ color: 'var(--wb-accent)' }}>losing customers?</span>
              </h1>

              {/* Subheadline */}
              <p
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                  color: 'var(--wb-muted)',
                  maxWidth: 680,
                  lineHeight: 1.65,
                  marginBottom: '1.25rem',
                }}
              >
                Get a full technical and UX report across{' '}
                <strong style={{ color: 'var(--wb-text)', fontWeight: 600 }}>51 checks</strong>{' '}
                in 6 categories. Results stream live - first findings in seconds.
              </p>

              {/* Social proof + CTA link */}
              <p style={{ fontSize: 14, color: 'var(--wb-muted)', marginBottom: '1.75rem' }}>
                Trusted by businesses and developers to identify what is holding their websites back.{' '}
                <button
                  onClick={() => setBookingOpen(true)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: 'var(--wb-accent)', textDecoration: 'underline', textUnderlineOffset: 3,
                    fontWeight: 600, fontSize: 'inherit',
                  }}
                >
                  Book a free discovery call
                </button>
              </p>

              {/*
               * URL input with corner brackets.
               * This is the "source" of the morph - exits upward
               * while the header input enters from below.
               */}
              <div style={{ position: 'relative', width: '100%', maxWidth: 720, padding: 12 }}>
                <CornerBracket pos="tl" />
                <CornerBracket pos="tr" />
                <CornerBracket pos="bl" />
                <CornerBracket pos="br" />
                <AuditInput
                  onSubmit={runAudit}
                  onReset={reset}
                  status={state.status}
                  error={null}
                  currentUrl={state.url}
                />
              </div>

              {/* Error */}
              {state.error && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded mt-4"
                  style={{
                    fontSize: 13,
                    color: 'var(--wb-critical)',
                    background: 'color-mix(in srgb, var(--wb-critical) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--wb-critical) 20%, transparent)',
                    maxWidth: 560, width: '100%',
                  }}
                >
                  <span>⚠</span>
                  {state.error}
                </div>
              )}

              {/* Trust line */}
              <p style={{ fontSize: 13, color: 'var(--wb-muted)', marginTop: '1.5rem' }}>
                Powered by <a href="https://exlinelabs.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--wb-muted)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Exline Labs</a> - Google PageSpeed Insights + axe-core WCAG engine
              </p>
            </section>

            {/* Category breakdown grid */}
            <section style={{ width: '100%', padding: '0 0 4rem' }}>
              <div className="flex items-center gap-3 mb-4">
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--wb-muted)' }}>
                  What we check
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--wb-border)' }} />
              </div>

              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-px"
                style={{
                  background: 'var(--wb-border)',
                  border: '1px solid var(--wb-border)',
                  borderRadius: 8, overflow: 'hidden',
                }}
              >
                {CATEGORIES.map(({ cat, checks, desc }) => (
                  <div
                    key={cat}
                    className="flex flex-col gap-1 px-4 py-4"
                    style={{ background: 'var(--wb-surface)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--wb-text)' }}>{cat}</span>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700,
                          color: 'var(--wb-accent)',
                          background: 'color-mix(in srgb, var(--wb-accent) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--wb-accent) 20%, transparent)',
                          padding: '1px 6px', borderRadius: 4,
                        }}
                      >
                        {checks}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--wb-muted)', lineHeight: 1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>

              {/* Stats strip */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 mt-4 px-4 py-3 rounded"
                style={{ background: 'var(--wb-surface)', border: '1px solid var(--wb-border)' }}
              >
                {[
                  { v: '51', l: 'total checks' },
                  { v: '6',  l: 'categories' },
                  { v: '~20s', l: 'average time' },
                  { v: '100%', l: 'free' },
                ].map(({ v, l }) => (
                  <div key={l} className="flex flex-col items-center flex-1">
                    <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--wb-text)', letterSpacing: '-0.02em' }}>{v}</span>
                    <span style={{ fontSize: 12, color: 'var(--wb-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{l}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── RESULTS AREA - fades in after hero exits ─────────────────────── */}
      {/*
       * Renders immediately so AuditReport can start its own streaming logic,
       * but is visually hidden (opacity 0, translateY 20px) until active.
       * The 0.28s delay lets the hero collapse begin before results appear.
       */}
      <div
        className="flex-1 px-4 sm:px-8 lg:px-[70px] py-6 w-full"
        style={{
          opacity: active ? 1 : 0,
          transform: active ? 'translateY(0)' : 'translateY(20px)',
          transition: active
            ? `opacity 0.4s 0.28s ${ease}, transform 0.4s 0.28s ${ease}`
            : `opacity 0.2s ${ease}, transform 0.2s ${ease}`,
          pointerEvents: active ? 'auto' : 'none',
        }}
      >
        {/* Error banner */}
        {state.error && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded mb-4"
            style={{
              fontSize: 13,
              color: 'var(--wb-critical)',
              background: 'color-mix(in srgb, var(--wb-critical) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--wb-critical) 20%, transparent)',
            }}
          >
            <span>⚠</span>
            {state.error}
          </div>
        )}

        {/* Loading spinner - shown while fetching before first results arrive */}
        {state.status === 'running' && Object.keys(state.categories).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="rounded-full border-2"
              style={{
                width: 38, height: 38,
                borderColor: 'var(--wb-border)',
                borderTopColor: 'var(--wb-accent)',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: 14, color: 'var(--wb-muted)' }}>
              Fetching and analysing{' '}
              <span style={{ color: 'var(--wb-text)', fontFamily: 'var(--font-geist-mono, monospace)' }}>
                {state.url}
              </span>
              ...
            </p>
          </div>
        )}

        {/* Audit report */}
        <AuditReport state={state} onRerun={() => runAudit(state.url)} onRetryCategory={retryCategory} />
      </div>

      {bookingOpen && <BookingModal onClose={() => setBookingOpen(false)} />}
    </div>
  );
}
