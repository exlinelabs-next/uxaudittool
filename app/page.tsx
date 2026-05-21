'use client';

import { useAudit } from '@/lib/hooks/useAudit';
import { AuditInput } from '@/components/audit/AuditInput';
import { AuditReport } from '@/components/audit/AuditReport';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  const { state, runAudit, reset } = useAudit();
  const hasResult = state.status !== 'idle';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--wb-bg)' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: 'var(--wb-bg)',
          borderBottom: '1px solid var(--wb-border)',
        }}
      >
        {/* Inner wrapper — same width constraint as <main> */}
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center gap-3">

          {/* Logo */}
          <a
            href="https://webbeet.studio"
            className="text-sm font-bold tracking-tight shrink-0"
            style={{ color: 'var(--wb-text)' }}
          >
            web<span style={{ color: 'var(--wb-accent)' }}>beet</span>
            <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--wb-muted)' }}>
              UX Audit
            </span>
          </a>

          {/* URL input — fills available space */}
          <div className="flex-1">
            <AuditInput
              onSubmit={runAudit}
              onReset={reset}
              status={state.status}
              error={null}
              currentUrl={state.url}
            />
          </div>

          {/* Stats strip */}
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            {[
              { v: '51', l: 'checks' },
              { v: '6',  l: 'categories' },
            ].map(({ v, l }) => (
              <div key={l} className="flex items-baseline gap-1">
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--wb-accent)' }}>{v}</span>
                <span className="text-xs" style={{ color: 'var(--wb-muted)' }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-5xl mx-auto w-full">

        {/* Error below header */}
        {state.error && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded text-xs mb-4"
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

        {/* Empty / idle state */}
        {!hasResult && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--wb-text)' }}>
                Website UX Audit
              </h1>
              <p className="text-sm max-w-md" style={{ color: 'var(--wb-muted)' }}>
                Enter any URL above to run a free audit across SEO, performance, trust, mobile and accessibility.
                Results stream in real time - first results appear within seconds.
              </p>
            </div>

            {/* What we check */}
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-px w-full max-w-lg text-xs"
              style={{ background: 'var(--wb-border)', border: '1px solid var(--wb-border)', borderRadius: 6, overflow: 'hidden' }}
            >
              {[
                { cat: 'SEO',           checks: 13, desc: 'Title, meta, headings, Open Graph' },
                { cat: 'Trust',         checks: 7,  desc: 'HTTPS, privacy, contact, social'   },
                { cat: 'UX Signals',    checks: 9,  desc: 'CTA, navigation, forms, chat'      },
                { cat: 'Performance',   checks: 8,  desc: 'Core Web Vitals, page weight'       },
                { cat: 'Mobile',        checks: 6,  desc: 'Viewport, tap targets, font size'   },
                { cat: 'Accessibility', checks: 8,  desc: 'axe-core automated WCAG scan'       },
              ].map(({ cat, checks, desc }) => (
                <div
                  key={cat}
                  className="flex flex-col gap-0.5 px-3 py-2.5"
                  style={{ background: 'var(--wb-surface)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: 'var(--wb-text)' }}>{cat}</span>
                    <span className="font-mono" style={{ color: 'var(--wb-muted)' }}>{checks}</span>
                  </div>
                  <span style={{ color: 'var(--wb-muted)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {state.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--wb-border)', borderTopColor: 'var(--wb-accent)' }} />
            <p className="text-sm" style={{ color: 'var(--wb-muted)' }}>
              Fetching and analysing <span className="font-mono" style={{ color: 'var(--wb-text)' }}>{state.url}</span>...
            </p>
          </div>
        )}

        {/* Results */}
        <AuditReport state={state} />
      </main>
    </div>
  );
}
