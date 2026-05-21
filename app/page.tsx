'use client';

import { useAudit } from '@/lib/hooks/useAudit';
import { AuditInput } from '@/components/audit/AuditInput';
import { AuditReport } from '@/components/audit/AuditReport';
import { ThemeToggle } from '@/components/ThemeToggle';

/* ── Decorative bracket used in hero ─────────────────────────────────────── */
function CornerBracket({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 18;
  const stroke = 'var(--wb-accent)';
  const t = pos.startsWith('t'), l = pos.endsWith('l');
  return (
    <svg
      width={size} height={size} viewBox="0 0 18 18" fill="none"
      style={{
        position: 'absolute',
        top:    t ? 0 : 'auto', bottom: t ? 'auto' : 0,
        left:   l ? 0 : 'auto', right:  l ? 'auto' : 0,
        opacity: 0.7,
      }}
    >
      {l && t && <><path d="M1 9V1H9"  stroke={stroke} strokeWidth="1.5" strokeLinecap="round" /></>}
      {!l && t && <><path d="M17 9V1H9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" /></>}
      {l && !t && <><path d="M1 9V17H9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" /></>}
      {!l && !t && <><path d="M17 9V17H9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" /></>}
    </svg>
  );
}

/* ── Category data for the feature grid ──────────────────────────────────── */
const CATEGORIES = [
  { cat: 'SEO',           checks: 13, desc: 'Title, meta, headings, Open Graph, structured data' },
  { cat: 'Trust',         checks: 7,  desc: 'HTTPS, privacy policy, contact info, social proof'  },
  { cat: 'UX Signals',    checks: 9,  desc: 'CTAs, navigation clarity, forms, live chat'         },
  { cat: 'Performance',   checks: 8,  desc: 'Core Web Vitals, LCP, CLS, page weight'             },
  { cat: 'Mobile',        checks: 6,  desc: 'Viewport, tap targets, font legibility'              },
  { cat: 'Accessibility', checks: 8,  desc: 'axe-core WCAG scan, ARIA, contrast'                 },
];

export default function HomePage() {
  const { state, runAudit, reset } = useAudit();
  const hasResult = state.status !== 'idle';
  const isActive  = state.status === 'loading' || state.status === 'partial' || state.status === 'complete';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--wb-bg)' }}>

      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20"
        style={{ background: 'var(--wb-bg)', borderBottom: '1px solid var(--wb-border)' }}
      >
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center gap-3">

          {/* Logo */}
          <a
            href="https://webbeet.studio"
            className="shrink-0"
            style={{ color: 'var(--wb-text)', textDecoration: 'none' }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>
              web<span style={{ color: 'var(--wb-accent)' }}>beet</span>
            </span>
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--wb-muted)' }}>
              UX Audit
            </span>
          </a>

          {/* URL input — fills available space, hidden on idle (full hero below) */}
          {hasResult && (
            <div className="flex-1">
              <AuditInput
                onSubmit={runAudit}
                onReset={reset}
                status={state.status}
                error={null}
                currentUrl={state.url}
              />
            </div>
          )}

          {/* Spacer when no input shown */}
          {!hasResult && <div className="flex-1" />}

          {/* Stats — only show when no audit running */}
          {!isActive && (
            <div className="hidden sm:flex items-center gap-5 shrink-0">
              {[
                { v: '51', l: 'checks' },
                { v: '6',  l: 'categories' },
              ].map(({ v, l }) => (
                <div key={l} className="flex items-baseline gap-1">
                  <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--wb-accent)' }}>{v}</span>
                  <span style={{ fontSize: 12, color: 'var(--wb-muted)' }}>{l}</span>
                </div>
              ))}
            </div>
          )}

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">

        {/* ── IDLE: Hero landing page ─────────────────────────────────── */}
        {!hasResult && (
          <div className="flex-1 flex flex-col">

            {/* Hero */}
            <section className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-12 text-center">

              {/* Eyebrow tag */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-medium"
                style={{
                  border: '1px solid color-mix(in srgb, var(--wb-accent) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--wb-accent) 6%, transparent)',
                  color: 'var(--wb-accent)',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--wb-accent)', display: 'inline-block' }} />
                Free · No signup · Instant results
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: 'var(--wb-text)',
                  maxWidth: 700,
                  marginBottom: '1rem',
                }}
              >
                Is your website
                {' '}
                <span
                  style={{
                    color: 'var(--wb-accent)',
                    display: 'inline-block',
                  }}
                >
                  losing customers?
                </span>
              </h1>

              {/* Subheadline */}
              <p
                style={{
                  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                  color: 'var(--wb-muted)',
                  maxWidth: 520,
                  lineHeight: 1.65,
                  marginBottom: '2.5rem',
                }}
              >
                Get a full technical and UX report across{' '}
                <strong style={{ color: 'var(--wb-text)', fontWeight: 600 }}>51 checks</strong>{' '}
                in 6 categories. Results stream in real time - first results in seconds.
              </p>

              {/* URL input with corner brackets */}
              <div style={{ position: 'relative', width: '100%', maxWidth: 560, padding: 10 }}>
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
                  className="flex items-center gap-2 px-3 py-2.5 rounded text-sm mt-4"
                  style={{
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
              <p style={{ fontSize: 12, color: 'var(--wb-dim)', marginTop: '1.25rem' }}>
                Powered by Google PageSpeed Insights + axe-core WCAG engine
              </p>
            </section>

            {/* Category breakdown */}
            <section
              className="px-4 pb-16"
              style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}
            >
              {/* Section label */}
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
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                {CATEGORIES.map(({ cat, checks, desc }) => (
                  <div
                    key={cat}
                    className="flex flex-col gap-1 px-4 py-4"
                    style={{ background: 'var(--wb-surface)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--wb-text)' }}>{cat}</span>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                          color: 'var(--wb-accent)',
                          background: 'color-mix(in srgb, var(--wb-accent) 10%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--wb-accent) 20%, transparent)',
                          padding: '1px 6px', borderRadius: 4,
                        }}
                      >
                        {checks}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--wb-muted)', lineHeight: 1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>

              {/* Bottom strip */}
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
                    <span style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--wb-text)', letterSpacing: '-0.02em' }}>{v}</span>
                    <span style={{ fontSize: 11, color: 'var(--wb-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{l}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── LOADING: full-page spinner before first results arrive ───── */}
        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="rounded-full border-2"
              style={{
                width: 40, height: 40,
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

        {/* ── RESULTS ──────────────────────────────────────────────────── */}
        {hasResult && state.status !== 'loading' && (
          <div className="px-4 sm:px-6 py-4 max-w-5xl mx-auto w-full">
            {/* Error banner */}
            {state.error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded text-sm mb-4"
                style={{
                  color: 'var(--wb-critical)',
                  background: 'color-mix(in srgb, var(--wb-critical) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--wb-critical) 20%, transparent)',
                }}
              >
                <span>⚠</span>
                {state.error}
              </div>
            )}
            <AuditReport state={state} />
          </div>
        )}
      </main>
    </div>
  );
}
